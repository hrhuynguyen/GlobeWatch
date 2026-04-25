export type VectorMatch = {
  recordId: string;
  recordType: string;
  iso3: string;
  countryName: string;
  title: string;
  score: number;
  metricLabel: string;
  metricValue: string;
  description: string;
};

export type BenchmarkRequest = {
  query: string;
  iso3?: string;
  year?: number;
  month?: number;
  limit?: number;
};

export type BenchmarkResponse = {
  query: string;
  retrievalMode: string;
  embeddingProvider: string;
  matches: VectorMatch[];
  insight: string;
};

export type PredictiveRiskRequest = {
  year?: number;
  month?: number;
  limit?: number;
};

export type RiskSignal = {
  iso3: string;
  countryName: string;
  riskScore: number;
  riskLevel: string;
  drivers: string[];
  recommendedAction: string;
};

export type PredictiveRiskResponse = {
  year?: number;
  month?: number;
  method: string;
  risks: RiskSignal[];
};
