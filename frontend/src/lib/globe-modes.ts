import { compactNumber, percent, usd } from "@/lib/format";
import { severityColor } from "@/lib/severity";
import type { CrisisPoint, ViewMode } from "@/types/crisis";

export type LegendStep = {
  color: string;
  label: string;
};

export type ViewModeConfig = {
  label: string;
  description: string;
  metricLabel: string;
  legend: LegendStep[];
};

export const VIEW_MODES: Record<ViewMode, ViewModeConfig> = {
  severity: {
    label: "Severity",
    description: "Prioritizes current crisis intensity.",
    metricLabel: "Severity score",
    legend: [
      { color: "#ff3b30", label: "Critical 90+" },
      { color: "#ff8c42", label: "Severe 82-89" },
      { color: "#f4c95d", label: "High 72-81" },
      { color: "#83e6c5", label: "Moderate" }
    ]
  },
  "funding-gap": {
    label: "Funding gap",
    description: "Shows the largest unmet humanitarian appeal gaps.",
    metricLabel: "Funding gap",
    legend: [
      { color: "#ff3b30", label: "$1.8B+" },
      { color: "#ff8c42", label: "$1.2B-$1.8B" },
      { color: "#f4c95d", label: "$600M-$1.2B" },
      { color: "#83e6c5", label: "Below $600M" }
    ]
  },
  overlooked: {
    label: "Overlooked",
    description: "Highlights severe crises with low coverage.",
    metricLabel: "Overlooked score",
    legend: [
      { color: "#ff3b30", label: "70+" },
      { color: "#ff8c42", label: "55-69" },
      { color: "#f4c95d", label: "35-54" },
      { color: "#83e6c5", label: "Below 35" }
    ]
  },
  "predictive-risk": {
    label: "Predictive risk",
    description: "Blends severity, funding pressure, and scale of need.",
    metricLabel: "Risk score",
    legend: [
      { color: "#ff3b30", label: "88+" },
      { color: "#ff8c42", label: "78-87" },
      { color: "#f4c95d", label: "65-77" },
      { color: "#83e6c5", label: "Below 65" }
    ]
  }
};

export function getModeColor(crisis: CrisisPoint, mode: ViewMode): string {
  if (mode === "severity") {
    return severityColor(crisis.severityScore);
  }

  const value = getModeValue(crisis, mode);

  if (mode === "funding-gap") {
    if (value >= 1800000000) return "#ff3b30";
    if (value >= 1200000000) return "#ff8c42";
    if (value >= 600000000) return "#f4c95d";
    return "#83e6c5";
  }

  if (mode === "overlooked") {
    if (value >= 70) return "#ff3b30";
    if (value >= 55) return "#ff8c42";
    if (value >= 35) return "#f4c95d";
    return "#83e6c5";
  }

  if (value >= 88) return "#ff3b30";
  if (value >= 78) return "#ff8c42";
  if (value >= 65) return "#f4c95d";
  return "#83e6c5";
}

export function getModeValue(crisis: CrisisPoint, mode: ViewMode): number {
  if (mode === "severity") {
    return crisis.severityScore;
  }

  if (mode === "funding-gap") {
    return crisis.fundingGapUsd;
  }

  if (mode === "overlooked") {
    return Math.round(crisis.severityScore * (1 - crisis.coverageRatio));
  }

  const gapPressure = (1 - crisis.coverageRatio) * 100;
  const scalePressure = Math.min(100, crisis.peopleInNeed / 300000);
  return Math.round(crisis.severityScore * 0.55 + gapPressure * 0.3 + scalePressure * 0.15);
}

export function formatModeValue(crisis: CrisisPoint, mode: ViewMode): string {
  const value = getModeValue(crisis, mode);

  if (mode === "funding-gap") {
    return usd(value);
  }

  if (mode === "overlooked" || mode === "predictive-risk") {
    return String(value);
  }

  return String(crisis.severityScore);
}

export function getPointScale(crisis: CrisisPoint, mode: ViewMode): number {
  const value = getModeValue(crisis, mode);

  if (mode === "funding-gap") {
    return Math.min(1, value / 2200000000);
  }

  return Math.min(1, value / 100);
}

export function getCoverageSummary(crisis: CrisisPoint): string {
  return `${percent(crisis.coverageRatio)} funded, ${compactNumber(crisis.peopleInNeed)} people in need`;
}
