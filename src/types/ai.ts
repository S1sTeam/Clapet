export interface AIProviderConfig {
  id: string;
  name: string;
  defaultUrl: string;
  defaultModel: string;
  models: string[];
}

export interface VerifyKeyResult {
  ok: boolean;
  models?: string[];
  error?: string;
}

export interface ProxyTestResult {
  ok: boolean;
  ms?: number;
  status?: number;
  error?: string;
}
