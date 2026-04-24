export function severityColor(score: number): string {
  if (score >= 90) return "#ff3b30";
  if (score >= 82) return "#ff8c42";
  if (score >= 72) return "#f4c95d";
  return "#83e6c5";
}
