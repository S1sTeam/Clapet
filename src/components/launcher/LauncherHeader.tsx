import React from 'react';
import { electronIpc } from '../../services/electronIpc';
import { AppIcon, SearchIcon, MinimizeIcon, CloseIcon } from '../common/Icons';

interface LauncherHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const LauncherHeader: React.FC<LauncherHeaderProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <header id="l-header">
      <div id="l-header-left">
        <AppIcon id="l-app-icon" size={18} color="#fff" />
        <span id="l-title">Clapet</span>
      </div>

      <div id="l-search">
        <SearchIcon size={13} color="#888" />
        <input
          type="text"
          id="l-search-input"
          placeholder="Поиск"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div id="l-controls">
        <button className="tb-btn" id="minimize-btn" onClick={() => electronIpc.minimizeWindow()}>
          <MinimizeIcon size={10} />
        </button>
        <button className="tb-btn" id="close-btn" onClick={() => electronIpc.closeWindow()}>
          <CloseIcon size={10} />
        </button>
      </div>
    </header>
  );
};
