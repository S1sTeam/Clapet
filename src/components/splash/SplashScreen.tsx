import React from 'react';
import { AppIcon } from '../common/Icons';

interface SplashScreenProps {
  fadeOut?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ fadeOut }) => {
  return (
    <div id="splash" className={fadeOut ? 'fade-out' : ''}>
      <div id="splash-bg" />
      <div id="splash-inner">
        <div id="splash-icon-wrap">
          <AppIcon id="splash-icon" size={64} color="#fbf1c7" />
        </div>
        <div id="splash-title">Clapet</div>
        <div id="splash-subtitle">desktop pet</div>
        <div id="splash-dots">
          <span className="splash-dot" />
          <span className="splash-dot" />
          <span className="splash-dot" />
        </div>
      </div>
    </div>
  );
};
