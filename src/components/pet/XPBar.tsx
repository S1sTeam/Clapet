import React from 'react';
import type { PetStats } from '../../types/pet';

interface XPBarProps {
  stats: PetStats;
  visible: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({ stats, visible }) => {
  if (!visible) return null;

  const pct = Math.min(100, Math.max(0, (stats.xp / stats.maxXp) * 100));

  return (
    <div id="xp-bar-container">
      <div id="xp-bar">
        <div id="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span id="xp-bar-text">Ур. {stats.level}</span>
    </div>
  );
};
