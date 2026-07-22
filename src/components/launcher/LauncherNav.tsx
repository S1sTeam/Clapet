import React from 'react';
import { PlayIcon, PetSettingsIcon, AIIcon, SettingsIcon } from '../common/Icons';

export type LauncherTab = 'tab-launch' | 'tab-pet-settings' | 'tab-ai' | 'tab-main-settings';

interface LauncherNavProps {
  activeTab: LauncherTab;
  onTabChange: (tab: LauncherTab) => void;
}

export const LauncherNav: React.FC<LauncherNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav id="l-tabs">
      <button
        className={`l-tab ${activeTab === 'tab-launch' ? 'active' : ''}`}
        onClick={() => onTabChange('tab-launch')}
      >
        <PlayIcon size={14} />
        <span>Запуск</span>
      </button>

      <button
        className={`l-tab ${activeTab === 'tab-pet-settings' ? 'active' : ''}`}
        onClick={() => onTabChange('tab-pet-settings')}
      >
        <PetSettingsIcon size={14} />
        <span>Питомец</span>
      </button>

      <button
        className={`l-tab ${activeTab === 'tab-ai' ? 'active' : ''}`}
        onClick={() => onTabChange('tab-ai')}
      >
        <AIIcon size={14} />
        <span>AI</span>
      </button>

      <button
        className={`l-tab ${activeTab === 'tab-main-settings' ? 'active' : ''}`}
        onClick={() => onTabChange('tab-main-settings')}
      >
        <SettingsIcon size={14} />
        <span>Настройки</span>
      </button>
    </nav>
  );
};
