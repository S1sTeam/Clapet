export type PetState = 'idle' | 'thinking' | 'happy' | 'sleep' | 'walking' | 'angry' | 'burnt';

export interface PetStats {
  level: number;
  xp: number;
  maxXp: number;
  cookies: number;
  lastFeed: number;
}

export interface ParticleItem {
  id: string;
  char: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  scale: number;
  color: string;
  size: number;
}

export interface FloatingLetterItem {
  id: string;
  char: string;
  x: number;
  y: number;
  opacity: number;
}
