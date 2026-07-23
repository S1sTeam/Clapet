import { useState, useCallback, useEffect } from 'react';
import type { ParticleItem } from '../types/pet';

interface SpawnOptions {
  spread?: number;
  riseDistance?: number;
  sizeRange?: [number, number];
  startY?: 'middle' | 'bottom';
}

export function useParticles(enabled: boolean = true) {
  const [particles, setParticles] = useState<ParticleItem[]>([]);

  const spawnParticles = useCallback(
    (chars: string[], count: number = 8, color: string = '#8ab4f8', options: SpawnOptions = {}) => {
      if (!enabled) return;

      const { spread = 60, riseDistance = 140, sizeRange = [12, 22], startY = 'middle' } = options;

      const newItems: ParticleItem[] = [];
      const now = Date.now();

      for (let i = 0; i < count; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const startX = 93.5 + (Math.random() - 0.5) * spread;
        const startYPos = startY === 'bottom' ? 180 + Math.random() * 20 : 100 + (Math.random() - 0.5) * 30;
        const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
        const vx = (Math.random() - 0.5) * 1.5;
        const vy = -(1.5 + Math.random() * 2);

        newItems.push({
          id: `${now}-${i}-${Math.random()}`,
          char,
          x: startX,
          y: startYPos,
          vx,
          vy,
          opacity: 1,
          scale: 0.8 + Math.random() * 0.4,
          color,
          size,
        });
      }

      setParticles(prev => [...prev, ...newItems]);
    },
    [enabled]
  );

  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.035,
          }))
          .filter(p => p.opacity > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [particles.length]);

  return {
    particles,
    spawnParticles,
  };
}
