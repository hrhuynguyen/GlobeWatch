import type { CrisisPoint } from "@/types/crisis";

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
