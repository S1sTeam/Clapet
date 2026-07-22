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

interface ThoughtBubbleProps {
  text: string;
  visible: boolean;
  style?: React.CSSProperties;
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

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({ text, visible, style }) => {
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
    <div id="thought-bubble" style={style}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        {Icon && <Icon size={14} color={iconColor} style={{ flexShrink: 0 }} />}
        <span id="thought-text">{cleanText}</span>
      </div>
    </div>
  );
};

