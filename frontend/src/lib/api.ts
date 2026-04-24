import type { CrisisPoint } from "@/types/crisis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchCrises(signal?: AbortSignal): Promise<CrisisPoint[]> {
  const response = await fetch(`${API_BASE_URL}/api/globe/crises?year=2026&month=4`, {
    cache: "no-store",
    signal
  });

  if (!response.ok) {
    throw new Error(`Failed to load crises: ${response.status}`);
  }

  return response.json() as Promise<CrisisPoint[]>;
}

