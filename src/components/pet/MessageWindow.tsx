import React from 'react';
import {
  Ghost,
  Moon,
  Frown,
  Flame,
  Skull,
  AlertTriangle,
  Sparkles,
  Cookie,
  Smile,
} from 'lucide-react';

interface MessageWindowProps {
  text: string;
  visible: boolean;
  onClose?: () => void;
}

const EMOJI_TO_ICON_MAP: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  '👻': { icon: Ghost, color: '#a89984' },
  '😴': { icon: Moon, color: '#83a598' },
  '😾': { icon: Frown, color: '#fb4934' },
  '😡': { icon: Flame, color: '#fb4934' },
  '🤬': { icon: Flame, color: '#fb4934' },
  '💥': { icon: Flame, color: '#fe8019' },
  '💀': { icon: Skull, color: '#ebdbb2' },
  '🤢': { icon: Frown, color: '#b8bb26' },
  '🎈': { icon: Smile, color: '#fabd2f' },
  '😰': { icon: AlertTriangle, color: '#fabd2f' },
  '🧼': { icon: Sparkles, color: '#83a598' },
  '🔥': { icon: Flame, color: '#fe8019' },
  '💢': { icon: AlertTriangle, color: '#fb4934' },
  '🖕': { icon: Flame, color: '#fb4934' },
  '🍪': { icon: Cookie, color: '#fe8019' },
};

export const MessageWindow: React.FC<MessageWindowProps> = ({ text, visible, onClose }) => {
  if (!visible || !text) return null;

  let detectedIcon: React.ComponentType<any> | null = null;
  let iconColor = 'currentColor';
  let cleanText = text;

  for (const [emoji, info] of Object.entries(EMOJI_TO_ICON_MAP)) {
    if (text.includes(emoji)) {
      detectedIcon = info.icon;
      iconColor = info.color;
      cleanText = cleanText.split(emoji).join('').trim();
    }
  }

  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  const Icon = detectedIcon;

  return (
    <div id="message-window" className="visible show" onClick={onClose}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
        {Icon && (
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={iconColor} style={{ flexShrink: 0 }} />
          </div>
        )}
        <div id="message-content" style={{ flex: 1 }}>{cleanText}</div>
      </div>
    </div>
  );
};

