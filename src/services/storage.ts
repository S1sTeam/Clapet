import type { AppSettings } from '../types/settings';
import type { PetStats } from '../types/pet';

export const DEFAULT_SETTINGS: AppSettings = {
  breathSpeed: 3,
  breathAmplitude: 6,
  walkSpeed: 1,
  petColor: '#df7959',
  petOpacity: 1,
  autoThink: true,
  autoWalk: false,
  ttsEnabled: false,
  autoLaunch: false,
  alwaysOnTop: true,
  showParticles: true,
  floatLetters: true,
  fontSize: 13,
  accentColor: '#fe8019',
  proxy: {
    enabled: false,
    protocol: 'http',
    host: '',
    port: '',
    username: '',
    password: '',
  },
  provider: 'openai',
  apiKey: '',
  customUrl: '',
  selectedModel: '',
};

export const DEFAULT_STATS: PetStats = {
  level: 1,
  xp: 0,
  maxXp: 30,
  cookies: 0,
  lastFeed: 0,
};

const STORAGE_KEYS = {
  SETTINGS: 'clapet_settings',
  STATS: 'clapet_stats',
};

export const storage = {
  getSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed, proxy: { ...DEFAULT_SETTINGS.proxy, ...(parsed.proxy || {}) } };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  },

  getStats(): PetStats {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATS);
      if (!raw) return DEFAULT_STATS;
      return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_STATS;
    }
  },

  saveStats(stats: PetStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (err) {
      console.error('Failed to save stats:', err);
    }
  },
};
