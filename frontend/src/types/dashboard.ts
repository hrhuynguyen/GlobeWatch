export type DashboardTotals = {
  crisisCount: number;
  peopleInNeed: number;
  fundingRequestedUsd: number;
  fundingReceivedUsd: number;
  fundingGapUsd: number;
  coverageRatio: number;
};

export type DashboardCountryMetric = {
  iso3: string;
  countryName: string;
  severityScore: number;
  peopleInNeed: number;
  fundingGapUsd: number;
  coverageRatio: number;
  oversightScore: number;
};

export type FundingTrendPoint = {
  period: string;
  year: number;
  month: number;
  fundingRequestedUsd: number;
  fundingReceivedUsd: number;
  fundingGapUsd: number;
  coverageRatio: number;
};

export type ClusterDistributionPoint = {
  cluster: string;
  projectCount: number;
  requestedFunds: number;
  targetBeneficiaries: number;
  averageAnomalyScore: number;
};

export type DashboardSummary = {
  year: number | null;
  month: number | null;
  source: string;
  generatedAt: string | null;
  totals: DashboardTotals;
  worstMismatch: DashboardCountryMetric | null;
  topUnderfunded: DashboardCountryMetric[];
  fundingTrend: FundingTrendPoint[];
  clusterDistribution: ClusterDistributionPoint[];
};
