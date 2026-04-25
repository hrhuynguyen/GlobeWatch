"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, Bot, Keyboard, Mic, MicOff, Radio, Volume2 } from "lucide-react";

import { askCrisisQuestion, fetchVoiceConfig, requestVoiceLiveToken } from "@/lib/api";
import { VIEW_MODES } from "@/lib/globe-modes";
import type { AskResponse } from "@/types/ask";
import type { CrisisPoint, ViewMode } from "@/types/crisis";
import type { VoiceConfig } from "@/types/voice";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

type VoiceAgentPanelProps = {
  selected: CrisisPoint;
  crises: CrisisPoint[];
  year: number;
  month: number;
  onSelect: (crisis: CrisisPoint) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSetComparisonIso3: (iso3: string | null) => void;
  onSetComparisonEnabled: (enabled: boolean) => void;
};

const COMMAND_EXAMPLES = [
  "Show Sudan on the globe",
  "Switch to funding gap mode",
  "Compare Sudan and Yemen",
  "Ask which crises are most underfunded",
  "Generate a report for Somalia",
  "Reset the view"
];

const MODE_ALIASES: Array<{ mode: ViewMode; terms: string[] }> = [
  { mode: "funding-gap", terms: ["funding gap", "funding", "underfunded", "gap mode"] },
  { mode: "predictive-risk", terms: ["predictive risk", "risk mode", "risk"] },
  { mode: "overlooked", terms: ["overlooked", "low coverage"] },
  { mode: "severity", terms: ["severity", "severity mode"] }
];

export function VoiceAgentPanel({
  selected,
  crises,
  year,
  month,
  onSelect,
  onSetViewMode,
  onSetComparisonIso3,
  onSetComparisonEnabled
}: VoiceAgentPanelProps) {
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null);
  const [typedCommand, setTypedCommand] = useState("");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [message, setMessage] = useState("Push to talk or type a safe command.");
  const [lastAnswer, setLastAnswer] = useState<AskResponse | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");

  const supportsSpeechRecognition = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const voiceWindow = window as VoiceWindow;
    return Boolean(voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchVoiceConfig(controller.signal)
      .then(setVoiceConfig)
      .catch(() => {
        setVoiceConfig({
          provider: "browser-speech",
          liveModel: "gemini-3.1-flash-live-preview",
          liveConfigured: false,
          fallbackProvider: "web-speech-api",
          tokenEndpoint: "/api/voice/live-token"
        });
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function startListening() {
    if (!supportsSpeechRecognition) {
      setStatus("error");
      setMessage("This browser does not expose the Web Speech API. Type the command instead.");
      return;
    }

    const voiceWindow = window as VoiceWindow;
    const Recognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    finalTranscriptRef.current = "";
    setTranscript("");
    setLastAnswer(null);
    setStatus("listening");
    setMessage("Listening. Speak one command, then pause.");

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const phrase = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscriptRef.current = `${finalTranscriptRef.current} ${phrase}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${phrase}`.trim();
        }
      }
      setTranscript(finalTranscriptRef.current || interimTranscript);
    };

    recognition.onerror = () => {
      setStatus("error");
      setMessage("Voice recognition failed. Try again or type the command.");
    };

    recognition.onend = () => {
      const finalTranscript = finalTranscriptRef.current.trim();
      recognitionRef.current = null;
      if (finalTranscript) {
        void executeCommand(finalTranscript);
      } else {
        setStatus("idle");
        setMessage("No command detected. Try push-to-talk again or type it.");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setStatus("thinking");
    setMessage("Processing voice command...");
  }

  async function handleTypedCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const command = typedCommand.trim();
    if (!command) {
      return;
    }
    setTranscript(command);
    setTypedCommand("");
    await executeCommand(command);
  }

  async function warmGeminiLiveToken() {
    const controller = new AbortController();
    try {
      setStatus("thinking");
      setMessage("Requesting a short-lived Gemini Live token...");
      await requestVoiceLiveToken(controller.signal);
      speak("Gemini Live token is ready for a direct browser voice session.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to create Gemini Live token.");
    }
  }

  async function executeCommand(rawCommand: string) {
    const command = normalize(rawCommand);
    setStatus("thinking");
    setMessage(`Processing: "${rawCommand}"`);
    setLastAnswer(null);

    if (command.includes("reset")) {
      onSetViewMode("severity");
      onSetComparisonEnabled(false);
      onSetComparisonIso3(null);
      if (crises[0]) {
        onSelect(crises[0]);
      }
      speak("Reset the globe to severity mode.");
      return;
    }

    const mode = findRequestedMode(command);
    if (mode && (command.includes("switch") || command.includes("mode") || command.includes("show"))) {
      onSetViewMode(mode);
      speak(`Switched to ${VIEW_MODES[mode].label} mode.`);
      return;
    }

    if (command.includes("compare")) {
      const countries = findMentionedCountries(command, crises);
      if (countries.length >= 2) {
        onSelect(countries[0]);
        onSetComparisonIso3(countries[1].iso3);
        onSetComparisonEnabled(true);
        speak(`Comparing ${countries[0].countryName} with ${countries[1].countryName}.`);
        return;
      }
    }

    const mentionedCountry = findMentionedCountries(command, crises)[0];
    if (mentionedCountry && (command.includes("show") || command.includes("select") || command.includes("open"))) {
      onSelect(mentionedCountry);
      speak(`Showing ${mentionedCountry.countryName} on the globe.`);
      return;
    }

    if (command.includes("report")) {
      const countryName = mentionedCountry?.countryName ?? selected.countryName;
      if (mentionedCountry) {
        onSelect(mentionedCountry);
      }
      speak(`Reports are planned for Phase 9. I selected ${countryName} context for now.`);
      return;
    }

    await askWithVoice(rawCommand.replace(/^ask\s+/i, ""));
  }

  async function askWithVoice(question: string) {
    try {
      const response = await askCrisisQuestion({
        question,
        year,
        month,
        selectedIso3: selected.iso3
      });
      setLastAnswer(response);
      speak(response.answer);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to answer this voice question.");
    }
  }

  function speak(nextMessage: string) {
    setMessage(nextMessage);

    if (!("speechSynthesis" in window)) {
      setStatus("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(nextMessage);
    utterance.rate = 1.02;
    utterance.pitch = 0.95;
    utterance.onstart = () => setStatus("speaking");
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
  }

  const liveLabel = voiceConfig?.liveConfigured ? "Gemini Live ready" : "Web Speech fallback";
  const statusLabel = status === "idle" ? liveLabel : status;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/35 p-4 text-stone-200 shadow-glow backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-mint/20 bg-mint/10 p-3 text-mint">
            <Bot size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-mint">Phase 8 voice agent</p>
            <h2 className="mt-1 text-lg font-black text-stone-50">Command the globe</h2>
            <p className="mt-1 text-xs leading-5 text-stone-400">
              Primary path: {voiceConfig?.liveModel ?? "gemini-3.1-flash-live-preview"}. Current demo uses browser
              speech for safe client commands.
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[0.66rem] uppercase tracking-[0.16em] ${
            voiceConfig?.liveConfigured
              ? "border-mint/30 bg-mint/10 text-mint"
              : "border-white/10 bg-white/[0.04] text-stone-400"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={status === "listening" ? stopListening : startListening}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
            status === "listening"
              ? "border-alert bg-alert text-ink"
              : "border-mint/30 bg-mint text-ink hover:bg-stone-100"
          }`}
        >
          {status === "listening" ? <MicOff size={16} /> : <Mic size={16} />}
          {status === "listening" ? "Stop" : "Push to talk"}
        </button>
        <button
          type="button"
          onClick={() => window.speechSynthesis?.cancel()}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-300 transition hover:border-white/30"
        >
          <Volume2 size={16} />
          Mute
        </button>
        <button
          type="button"
          onClick={warmGeminiLiveToken}
          disabled={!voiceConfig?.liveConfigured}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-300 transition hover:border-white/30 disabled:cursor-not-allowed disabled:text-stone-600"
        >
          <Radio size={16} />
          Live token
        </button>
      </div>

      <form className="mt-3 flex gap-2" onSubmit={handleTypedCommand}>
        <input
          value={typedCommand}
          onChange={(event) => setTypedCommand(event.target.value)}
          placeholder="Type a command if voice is unavailable..."
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-mint/60"
        />
        <button
          type="submit"
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 text-stone-300 transition hover:border-mint/40"
          aria-label="Run typed voice command"
        >
          <Keyboard size={18} />
        </button>
      </form>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">State</p>
        <p className="mt-1 text-sm leading-6 text-stone-300">{message}</p>
        {transcript ? <p className="mt-2 text-xs text-stone-500">Heard: {transcript}</p> : null}
        {!supportsSpeechRecognition ? (
          <p className="mt-2 flex items-center gap-2 text-xs text-alert">
            <AlertTriangle size={14} />
            Voice recognition is unavailable in this browser. Text fallback is active.
          </p>
        ) : null}
      </div>

      {lastAnswer ? (
        <div className="mt-3 rounded-2xl border border-mint/20 bg-mint/10 p-3 text-sm leading-6 text-stone-200">
          {lastAnswer.answer}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {COMMAND_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setTranscript(example);
              void executeCommand(example);
            }}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-left text-[0.7rem] text-stone-400 transition hover:border-mint/40 hover:text-stone-100"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findRequestedMode(command: string): ViewMode | null {
  return MODE_ALIASES.find((entry) => entry.terms.some((term) => command.includes(term)))?.mode ?? null;
}

function findMentionedCountries(command: string, crises: CrisisPoint[]): CrisisPoint[] {
  return crises.filter((crisis) => {
    const country = normalize(crisis.countryName);
    const iso3 = crisis.iso3.toLowerCase();
    return command.includes(country) || command.includes(iso3);
  });
}
