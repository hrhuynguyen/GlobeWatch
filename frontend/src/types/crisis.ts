export type SeverityClass = "moderate" | "high" | "severe" | "critical";

export type CrisisPoint = {
  iso3: string;
  countryName: string;
  crisisName: string;
  lat: number;
  lng: number;
  region: string;
  severityScore: number;
  severityClass: SeverityClass;
  peopleInNeed: number;
  fundingRequestedUsd: number;
  fundingReceivedUsd: number;
  fundingGapUsd: number;
  coverageRatio: number;
  lastUpdated: string;
  summary: string;
};
