export interface AiProviderConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface AiSummaryResult {
  summary: string;
  keywords: string[];
}
