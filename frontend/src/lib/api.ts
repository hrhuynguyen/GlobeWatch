import type { CrisisPoint } from "@/types/crisis";
import type { DashboardSummary } from "@/types/dashboard";
import type { AskRequest, AskResponse } from "@/types/ask";
import type { BenchmarkRequest, BenchmarkResponse, PredictiveRiskRequest, PredictiveRiskResponse } from "@/types/ai";
import type { VoiceConfig, VoiceLiveToken } from "@/types/voice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchCrises(year: number, month: number, signal?: AbortSignal): Promise<CrisisPoint[]> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month)
  });

  const response = await fetch(`${API_BASE_URL}/api/globe/crises?${params.toString()}`, {
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to load crises: ${response.status}`);
  }

  return response.json() as Promise<CrisisPoint[]>;
}

export async function fetchDashboardSummary(
  year: number,
  month: number,
  signal?: AbortSignal
): Promise<DashboardSummary> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month)
  });

  const response = await fetch(`${API_BASE_URL}/api/dashboard/summary?${params.toString()}`, {
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to load dashboard summary: ${response.status}`);
  }

  return response.json() as Promise<DashboardSummary>;
}

export async function askCrisisQuestion(request: AskRequest, signal?: AbortSignal): Promise<AskResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ask`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request),
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to answer question: ${response.status}`);
  }

  return response.json() as Promise<AskResponse>;
}

export async function benchmarkCrisisRecords(
  request: BenchmarkRequest,
  signal?: AbortSignal
): Promise<BenchmarkResponse> {
  const response = await fetch(`${API_BASE_URL}/api/benchmark`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request),
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to benchmark records: ${response.status}`);
  }

  return response.json() as Promise<BenchmarkResponse>;
}

export async function fetchPredictiveRisks(
  request: PredictiveRiskRequest,
  signal?: AbortSignal
): Promise<PredictiveRiskResponse> {
  const response = await fetch(`${API_BASE_URL}/api/predictive/risks`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request),
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to load predictive risks: ${response.status}`);
  }

  return response.json() as Promise<PredictiveRiskResponse>;
}

export async function fetchVoiceConfig(signal?: AbortSignal): Promise<VoiceConfig> {
  const response = await fetch(`${API_BASE_URL}/api/voice/config`, {
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to load voice config: ${response.status}`);
  }

  return response.json() as Promise<VoiceConfig>;
}

export async function requestVoiceLiveToken(signal?: AbortSignal): Promise<VoiceLiveToken> {
  const response = await fetch(`${API_BASE_URL}/api/voice/live-token`, {
    method: "POST",
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to create voice token: ${response.status}`);
  }

  return response.json() as Promise<VoiceLiveToken>;
}
