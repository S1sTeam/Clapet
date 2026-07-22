import React from 'react';
import { SleepIcon, FeedIcon, WalkIcon, AskIcon, SettingsIcon } from '../common/Icons';

export type RadialAction = 'sleep' | 'feed' | 'walk-toggle' | 'ask' | 'settings';

interface RadialMenuProps {
  visible: boolean;
  canAskAI: boolean;
  onAction: (action: RadialAction) => void;
  feedCooldownText?: string | null;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({ visible, canAskAI, onAction, feedCooldownText }) => {
  if (!visible) return null;

  const items: { action: RadialAction; icon: React.ReactNode; label: string; id?: string }[] = [
    { action: 'sleep', icon: <SleepIcon size={18} />, label: 'Спать' },
    { action: 'feed', icon: <FeedIcon size={18} />, label: 'Кормить', id: 'feed-btn' },
    { action: 'walk-toggle', icon: <WalkIcon size={18} />, label: 'Гулять', id: 'walk-btn' },
    { action: 'settings', icon: <SettingsIcon size={18} />, label: 'Настройки' },
  ];

  if (canAskAI) {
    items.splice(3, 0, { action: 'ask', icon: <AskIcon size={18} />, label: 'Спросить AI', id: 'ask-btn' });
  }

  // Calculate coordinates in circle around (cx, cy)
  const cx = 110;
  const cy = 135;
  const radius = 80;
  const startAngle = -90;
  const count = items.length;

  let feedPos = { left: 165.5, top: 93.5 };

  return (
    <div
      id="radial-menu"
      className="radial-menu visible"
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      {items.map((item, idx) => {
        const angle = startAngle + (360 / count) * idx;
        const rad = (angle * Math.PI) / 180;
        const left = cx + radius * Math.cos(rad);
        const top = cy + radius * Math.sin(rad);

        if (item.action === 'feed') {
          feedPos = { left, top };
        }

        return (
          <button
            key={item.action}
            className="radial-btn"
            id={item.id}
            data-action={item.action}
            aria-label={item.label}
            title={item.label}
            onClick={() => onAction(item.action)}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              transitionDelay: `${idx * 0.035}s`,
            }}
          >
            {item.icon}
          </button>
        );
      })}

      {feedCooldownText && (
        <span
          id="feed-timer"
          style={{
            left: `${feedPos.left}px`,
            top: `${feedPos.top + 22}px`,
          }}
        >
          {feedCooldownText}
        </span>
      )}
    </div>
  );
};
