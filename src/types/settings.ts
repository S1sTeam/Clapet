export interface ProxyConfig {
  enabled: boolean;
  protocol: 'http' | 'https' | 'socks5';
  host: string;
  port: string;
  username?: string;
  password?: string;
}

export interface AppSettings {
  breathSpeed: number; // 0.5 - 6
  breathAmplitude: number; // 1 - 15
  walkSpeed: number; // 0.2 - 3
  petColor: string; // hex
  petOpacity: number; // 0.2 - 1
  autoThink: boolean;
  autoWalk: boolean;
  ttsEnabled: boolean;
  autoLaunch: boolean;
  alwaysOnTop: boolean;
  showParticles: boolean;
  floatLetters: boolean;
  fontSize: number; // 10 - 18
  accentColor: string;
  proxy: ProxyConfig;
  provider: string;
  apiKey: string;
  customUrl: string;
  selectedModel: string;
}
