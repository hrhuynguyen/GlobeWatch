import { readFile } from "node:fs/promises";
import path from "node:path";

import type { CrisisPoint } from "@/types/crisis";

export async function getSampleCrises(): Promise<CrisisPoint[]> {
  const filePath = path.join(process.cwd(), "..", "data", "sample", "crises.json");
  const raw = await readFile(filePath, "utf8");

  return JSON.parse(raw) as CrisisPoint[];
}
