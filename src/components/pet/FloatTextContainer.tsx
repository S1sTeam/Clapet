import React from 'react';
import type { ParticleItem, FloatingLetterItem } from '../../types/pet';
import {
  Cookie,
  Heart,
  Moon,
  Sparkles,
  Star,
  Flame,
  Skull,
  Ghost,
  Zap,
  AlertTriangle,
  HelpCircle,
  Frown,
} from 'lucide-react';

const PARTICLE_ICON_MAP: Record<string, React.ComponentType<any>> = {
  cookie: Cookie,
  heart: Heart,
  moon: Moon,
  sparkles: Sparkles,
  star: Star,
  flame: Flame,
  skull: Skull,
  ghost: Ghost,
  zap: Zap,
  alert: AlertTriangle,
  help: HelpCircle,
  frown: Frown,
  // Emoji fallbacks
  '🍪': Cookie,
  '💖': Heart,
  '♥': Heart,
  '💤': Moon,
  '✨': Sparkles,
  '✦': Sparkles,
  '★': Star,
  '⭐': Star,
  '💥': Flame,
  '🔥': Flame,
  '💀': Skull,
  '👻': Ghost,
  '⚡': Zap,
  '💢': AlertTriangle,
  '🤬': AlertTriangle,
  '🖕': AlertTriangle,
  '🤢': Frown,
  '🎈': Sparkles,
  '😰': AlertTriangle,
  '🍪?': HelpCircle,
};

interface FloatTextContainerProps {
  particles: ParticleItem[];
  floatingLetters: FloatingLetterItem[];
}

export const FloatTextContainer: React.FC<FloatTextContainerProps> = ({ particles, floatingLetters }) => {
  return (
    <div id="float-text-container">
      {particles.map(p => {
        const IconComponent = PARTICLE_ICON_MAP[p.char];
        return (
          <span
            key={p.id}
            className="particle"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              opacity: p.opacity,
              transform: `scale(${p.scale})`,
              color: p.color,
              fontSize: `${p.size}px`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {IconComponent ? (
              <IconComponent
                size={p.size}
                color={p.color}
                fill={p.char === 'heart' || p.char === '💖' || p.char === '♥' ? p.color : 'none'}
              />
            ) : (
              p.char
            )}
          </span>
        );
      })}

      {floatingLetters.map(fl => (
        <span
          key={fl.id}
          className="float-letter"
          style={{
            left: `${fl.x}px`,
            top: `${fl.y}px`,
            opacity: fl.opacity,
          }}
        >
          {fl.char}
        </span>
      ))}
    </div>
  );
};

