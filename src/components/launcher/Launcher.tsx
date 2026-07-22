import React, { useState } from 'react';
import type { AppSettings } from '../../types/settings';
import type { PetStats } from '../../types/pet';
import { LauncherHeader } from './LauncherHeader';
import { LauncherNav, type LauncherTab } from './LauncherNav';
import { TabLaunch } from './TabLaunch';
import { TabPetSettings } from './TabPetSettings';
import { TabAISettings } from './TabAISettings';
import { TabMainSettings } from './TabMainSettings';

interface LauncherProps {
  settings: AppSettings;
  stats: PetStats;
  onUpdateSettings: (updater: Partial<AppSettings>) => void;
  onResetSettings: () => void;
  onLaunchPet: () => void;
}

export const Launcher: React.FC<LauncherProps> = ({
  settings,
  stats,
  onUpdateSettings,
  onResetSettings,
  onLaunchPet,
}) => {
  const [activeTab, setActiveTab] = useState<LauncherTab>('tab-launch');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div id="launcher">
      <LauncherHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <LauncherNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div id="l-body">
        <main id="content">
          {activeTab === 'tab-launch' && <TabLaunch settings={settings} onLaunchPet={onLaunchPet} />}
          {activeTab === 'tab-pet-settings' && (
            <TabPetSettings settings={settings} stats={stats} onUpdateSettings={onUpdateSettings} />
          )}
          {activeTab === 'tab-ai' && <TabAISettings settings={settings} onUpdateSettings={onUpdateSettings} />}
          {activeTab === 'tab-main-settings' && (
            <TabMainSettings settings={settings} onUpdateSettings={onUpdateSettings} onResetSettings={onResetSettings} />
          )}
        </main>
      </div>
    </div>
  );
};
