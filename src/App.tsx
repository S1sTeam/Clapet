import React, { useState, useEffect } from 'react';
import { useSettings } from './hooks/useSettings';
import { storage } from './services/storage';
import { electronIpc } from './services/electronIpc';
import type { PetStats } from './types/pet';
import { SplashScreen } from './components/splash/SplashScreen';
import { Launcher } from './components/launcher/Launcher';
import { PetMode } from './components/pet/PetMode';

export type AppMode = 'splash' | 'launcher' | 'pet';

export const App: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [stats, setStats] = useState<PetStats>(() => storage.getStats());
  const [mode, setMode] = useState<AppMode>('splash');

  // Initial splash timer & mode selection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (settings.autoLaunch) {
        setMode('pet');
        electronIpc.showPet();
      } else {
        setMode('launcher');
        electronIpc.showLauncher();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [settings.autoLaunch]);

  const handleUpdateStats = (newStats: PetStats) => {
    setStats(newStats);
    storage.saveStats(newStats);
  };

  const handleLaunchPet = () => {
    setMode('pet');
    electronIpc.showPet();
  };

  const handleReturnToLauncher = () => {
    setMode('launcher');
    electronIpc.showLauncher();
  };

  return (
    <div id="app-root">
      {mode === 'splash' && <SplashScreen />}
      {mode === 'launcher' && (
        <Launcher
          settings={settings}
          stats={stats}
          onUpdateSettings={updateSettings}
          onResetSettings={resetSettings}
          onLaunchPet={handleLaunchPet}
        />
      )}
      {mode === 'pet' && (
        <PetMode
          settings={settings}
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onReturnToLauncher={handleReturnToLauncher}
        />
      )}
    </div>
  );
};

export default App;
