export type VoiceConfig = {
  provider: string;
  liveModel: string;
  liveConfigured: boolean;
  fallbackProvider: string;
  tokenEndpoint: string;
};

export type VoiceLiveToken = {
  token: string;
  liveModel: string;
  expiresInSeconds: number;
  newSessionExpiresInSeconds: number;
};
