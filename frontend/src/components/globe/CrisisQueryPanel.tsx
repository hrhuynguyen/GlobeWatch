"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Database, Send, Sparkles } from "lucide-react";

import { askCrisisQuestion } from "@/lib/api";
import type { AskResponse } from "@/types/ask";
import type { CrisisPoint } from "@/types/crisis";

const SUGGESTIONS = [
  "Which countries have the worst funding gaps?",
  "Show top crises by people in need.",
  "What response priorities stand out?",
  "Find similar project benchmarks."
];

type CrisisQueryPanelProps = {
  selected: CrisisPoint;
  crises: CrisisPoint[];
  year: number;
  month: number;
  onSelect: (crisis: CrisisPoint) => void;
};

export function CrisisQueryPanel({ selected, crises, year, month, onSelect }: CrisisQueryPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setAnswer(null);
    setErrorMessage(null);
  }, [month, year]);

  async function submitQuestion(event?: FormEvent<HTMLFormElement>, overrideQuestion?: string) {
    event?.preventDefault();
    const nextQuestion = (overrideQuestion ?? question).trim();
    if (!nextQuestion) {
      return;
    }

    const controller = new AbortController();
    try {
      setIsAsking(true);
      setErrorMessage(null);
      setQuestion(nextQuestion);
      const response = await askCrisisQuestion(
        {
          question: nextQuestion,
          year,
          month,
          selectedIso3: selected.iso3
        },
        controller.signal
      );
      setAnswer(response);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : "Unable to answer this question");
    } finally {
      setIsAsking(false);
    }
  }

  function selectSource(iso3: string) {
    const sourceCrisis = crises.find((crisis) => crisis.iso3 === iso3);
    if (sourceCrisis) {
      onSelect(sourceCrisis);
    }
  }

  return (
    <div className="mb-5 rounded-[2rem] border border-mint/20 bg-[#071314] p-5 shadow-glow">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl border border-mint/20 bg-mint/10 p-3 text-mint">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-mint">Phase 7 AI layer</p>
          <h2 className="mt-1 text-xl font-bold text-stone-50">Ask GlobeWatch</h2>
          <p className="mt-1 text-sm leading-6 text-stone-400">
            Rules handle core metrics. Open-ended prompts use local vector RAG, with Gemini synthesis when configured.
          </p>
        </div>
      </div>

      <form className="mt-4 grid gap-3" onSubmit={(event) => submitQuestion(event)}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder={`Ask about ${selected.countryName}, funding gaps, severity, projects, or comparisons...`}
          className="min-h-24 resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-mint/60"
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-mint/30 bg-mint px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-ink transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-stone-500"
        >
          <Send size={16} />
          {isAsking ? "Answering" : "Ask"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => submitQuestion(undefined, suggestion)}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-stone-300 transition hover:border-mint/40 hover:text-stone-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-alert/30 bg-alert/10 p-3 text-sm text-stone-200">
          {errorMessage}
        </div>
      ) : null}

      {answer ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">{answer.intent.replaceAll("_", " ")}</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-stone-400">
              {answer.intent === "rag_answer"
                ? answer.llmProvider === "gemini" && answer.llmConfigured
                  ? "Gemini RAG"
                  : "Local RAG"
                : "Rules"}
            </span>
          </div>
          <p className="mt-2 text-[0.68rem] uppercase tracking-[0.18em] text-stone-500">
            Retrieval: {answer.retrievalMode} · Embeddings: {answer.embeddingProvider}
          </p>
          <p className="mt-3 text-sm leading-6 text-stone-200">{answer.answer}</p>

          {answer.sources.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {answer.sources.map((source) => (
                <button
                  key={`${source.iso3}-${source.metricLabel}`}
                  type="button"
                  onClick={() => selectSource(source.iso3)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-mint/40"
                >
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-mint">
                    <Database size={14} />
                    {source.countryName} · {source.metricLabel}
                  </span>
                  <span className="mt-2 block text-sm font-bold text-stone-50">{source.metricValue}</span>
                  <span className="mt-1 block text-xs leading-5 text-stone-400">{source.description}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
