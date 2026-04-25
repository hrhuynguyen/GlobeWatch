export type AskSource = {
  iso3: string;
  countryName: string;
  metricLabel: string;
  metricValue: string;
  description: string;
};

export type AskResponse = {
  question: string;
  answer: string;
  intent: string;
  confidence: number;
  sources: AskSource[];
  followUpQuestions: string[];
  llmProvider: string;
  llmConfigured: boolean;
  retrievalMode: string;
  embeddingProvider: string;
};

export type AskRequest = {
  question: string;
  year: number;
  month: number;
  selectedIso3?: string;
};
