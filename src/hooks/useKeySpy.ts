import { useState, useEffect } from 'react';
import type { FloatingLetterItem } from '../types/pet';

export function useKeySpy(enabled: boolean = true) {
  const [floatingLetters, setFloatingLetters] = useState<FloatingLetterItem[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key || e.key.length > 2) return;
      const char = e.key.toUpperCase();

      setFloatingLetters((prev) => {
        const newItem: FloatingLetterItem = {
          id: `${Date.now()}-${Math.random()}`,
          char,
          x: 40 + Math.random() * 100,
          y: 160 + Math.random() * 20,
          opacity: 1,
        };
        return [...prev.slice(-15), newItem];
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  useEffect(() => {
    if (floatingLetters.length === 0) return;

    const interval = setInterval(() => {
      setFloatingLetters((prev) =>
        prev
          .map((item) => ({
            ...item,
            y: item.y - 1.5,
            opacity: item.opacity - 0.04,
          }))
          .filter((item) => item.opacity > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [floatingLetters.length]);

  return {
    floatingLetters,
  };
}
