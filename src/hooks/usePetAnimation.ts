import { useState, useEffect, useRef, useCallback } from 'react';
import type { PetState } from '../types/pet';

const EYE_BASES = {
  left: { x: 73, y: 135, w: 30, h: 20 },
  right: { x: 119, y: 135, w: 30, h: 20 },
};

const EYE_MAX_MOVE = 12;
const BODY_BOUNDS = { x1: 45, y1: 100, x2: 175, y2: 190 };

export function usePetAnimation(initialState: PetState = 'idle') {
  const [petState, setPetState] = useState<PetState>(initialState);
  const [leftEyePos, setLeftEyePos] = useState({ x: EYE_BASES.left.x, y: EYE_BASES.left.y });
  const [rightEyePos, setRightEyePos] = useState({ x: EYE_BASES.right.x, y: EYE_BASES.right.y });
  const [pawAngle, setPawAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const cursorTargetRef = useRef({ x: 0, y: 0 });
  const eyeCurrentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const isTrackingRef = useRef(true);
  const idleTargetRef = useRef({ x: 0, y: 0 });

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const updateCursorTarget = useCallback((x: number, y: number) => {
    cursorTargetRef.current = { x, y };
  }, []);

  // Timer to randomly switch between tracking cursor and looking around / center
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNextStateChange = () => {
      // ~85% chance to track cursor (much higher tracking frequency)
      const shouldTrack = Math.random() < 0.85;
      isTrackingRef.current = shouldTrack;

      let nextDelay = 3500 + Math.random() * 4500;

      if (!shouldTrack) {
        // Short pause when looking away (1.5 - 3 seconds)
        nextDelay = 1500 + Math.random() * 1500;
        const glanceAround = Math.random() < 0.6;
        if (glanceAround) {
          idleTargetRef.current = {
            x: (Math.random() - 0.5) * (EYE_MAX_MOVE * 0.7),
            y: (Math.random() - 0.5) * (EYE_MAX_MOVE * 0.7),
          };
        } else {
          idleTargetRef.current = { x: 0, y: 0 };
        }
      }

      timeoutId = setTimeout(scheduleNextStateChange, nextDelay);
    };

    scheduleNextStateChange();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Eye update animation loop
  useEffect(() => {
    if (petState !== 'idle' && petState !== 'walking') {
      return;
    }

    const animateEyes = () => {
      // Window center is approximately (160, 150) in window coordinates (320x300)
      const centerX = 160;
      const centerY = 150;

      let targetMoveX = 0;
      let targetMoveY = 0;

      if (isTrackingRef.current) {
        let dx = cursorTargetRef.current.x - centerX;
        let dy = cursorTargetRef.current.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          // Smooth distance factor to eliminate sudden axis snaps when crossing center
          const factor = Math.min(1, dist / 200);
          targetMoveX = (dx / dist) * EYE_MAX_MOVE * factor;
          targetMoveY = (dy / dist) * EYE_MAX_MOVE * factor;
        }
      } else {
        targetMoveX = idleTargetRef.current.x;
        targetMoveY = idleTargetRef.current.y;
      }

      eyeCurrentRef.current.x = lerp(eyeCurrentRef.current.x, targetMoveX, 0.12);
      eyeCurrentRef.current.y = lerp(eyeCurrentRef.current.y, targetMoveY, 0.12);

      let lx = EYE_BASES.left.x + eyeCurrentRef.current.x;
      let ly = EYE_BASES.left.y + eyeCurrentRef.current.y;
      let rx = EYE_BASES.right.x + eyeCurrentRef.current.x;
      let ry = EYE_BASES.right.y + eyeCurrentRef.current.y;

      const ew = EYE_BASES.left.w;
      const eh = EYE_BASES.left.h;

      lx = Math.max(BODY_BOUNDS.x1, Math.min(BODY_BOUNDS.x2 - ew, lx));
      ly = Math.max(BODY_BOUNDS.y1, Math.min(BODY_BOUNDS.y2 - eh, ly));
      rx = Math.max(BODY_BOUNDS.x1 + (EYE_BASES.right.x - EYE_BASES.left.x), Math.min(BODY_BOUNDS.x2 - ew, rx));
      ry = Math.max(BODY_BOUNDS.y1, Math.min(BODY_BOUNDS.y2 - eh, ry));

      setLeftEyePos({ x: lx, y: ly });
      setRightEyePos({ x: rx, y: ry });

      rafRef.current = requestAnimationFrame(animateEyes);
    };

    rafRef.current = requestAnimationFrame(animateEyes);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [petState]);

  const triggerPawWave = useCallback(() => {
    const keyframes = [
      { angle: 0, t: 0 },
      { angle: 60, t: 0.35 },
      { angle: -10, t: 0.55 },
      { angle: 40, t: 0.75 },
      { angle: 0, t: 1 },
    ];
    const duration = 1400;
    let start: number | null = null;

    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const frame = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);

      let i = 0;
      while (i < keyframes.length - 1 && keyframes[i + 1].t <= p) i++;
      if (i >= keyframes.length - 1) {
        setPawAngle(0);
        return;
      }
      const a = keyframes[i],
        b = keyframes[i + 1];
      const local = (p - a.t) / (b.t - a.t);
      const angle = a.angle + (b.angle - a.angle) * easeInOut(local);
      setPawAngle(angle);
      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }, []);

  return {
    petState,
    setPetState,
    leftEyePos,
    rightEyePos,
    pawAngle,
    isDragging,
    setIsDragging,
    updateCursorTarget,
    triggerPawWave,
  };
}
