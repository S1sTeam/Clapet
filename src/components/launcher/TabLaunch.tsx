import React from 'react';
import type { AppSettings } from '../../types/settings';
import { PlayIcon } from '../common/Icons';

interface TabLaunchProps {
  settings: AppSettings;
  onLaunchPet: () => void;
}

export const TabLaunch: React.FC<TabLaunchProps> = ({ settings, onLaunchPet }) => {
  return (
    <section id="tab-launch" className="tab-content active">
      <h2>Запуск питомца</h2>
      <div className="card elevation-2">
        <div id="preview-area">
          <svg id="preview-svg" viewBox="0 0 220 240">
            <rect className="pf" x="45" y="100" width="130" height="90" fill={settings.petColor} />
            <rect className="pf" x="55" y="110" width="110" height="60" fill={settings.petColor} opacity="0.2" />
            <g id="preview-eyes">
              <rect x="73" y="135" width="30" height="20" fill="#1A1A1A" />
              <rect x="119" y="135" width="30" height="20" fill="#1A1A1A" />
            </g>
            <rect className="pf" x="58" y="185" width="14" height="22" fill={settings.petColor} />
            <rect className="pf" x="80" y="185" width="14" height="22" fill={settings.petColor} />
            <rect className="pf" x="128" y="185" width="14" height="22" fill={settings.petColor} />
            <rect className="pf" x="150" y="185" width="14" height="22" fill={settings.petColor} />
            <rect className="pf" x="25" y="132" width="20" height="20" fill={settings.petColor} />
            <rect className="pf" x="175" y="132" width="20" height="20" fill={settings.petColor} />
          </svg>
        </div>
        <button className="btn" id="launch-btn" onClick={onLaunchPet}>
          <PlayIcon size={16} />
          Запустить
        </button>
      </div>
    </section>
  );
};
