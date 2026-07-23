import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../types/settings';
import { storage } from '../services/storage';
import { electronIpc } from '../services/electronIpc';

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => storage.getSettings());

  const updateSettings = useCallback((updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
    setSettingsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  // Sync side effects (always on top, proxy, CSS root variables)
  useEffect(() => {
    electronIpc.setAlwaysOnTop(settings.alwaysOnTop);
    if (settings.proxy) {
      electronIpc.sendProxyConfig(settings.proxy);
    }

    document.documentElement.style.setProperty('--accent', settings.accentColor);
    document.documentElement.style.setProperty('--font-size-base', `${settings.fontSize}px`);
    document.documentElement.style.setProperty('--pet-color', settings.petColor);
    document.documentElement.style.setProperty('--breath-speed', `${settings.breathSpeed}s`);
    document.documentElement.style.setProperty('--breath-amp', `${settings.breathAmplitude}px`);
  }, [settings]);

  const resetSettings = useCallback(() => {
    const defaultSet = storage.getSettings();
    updateSettings(defaultSet);
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
