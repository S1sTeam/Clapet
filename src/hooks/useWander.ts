import { useState, useEffect, useRef, useCallback } from 'react';
import { electronIpc } from '../services/electronIpc';

export function useWander(autoWalkEnabled: boolean, walkSpeed: number, isDragging: boolean) {
  const [isWandering, setIsWandering] = useState(false);
  const wanderIntervalRef = useRef<any>(null);
  const wanderStepRef = useRef<any>(null);

  const startWanderStep = useCallback(async () => {
    if (!electronIpc.isElectron() || isDragging) return;

    const screenInfo = await electronIpc.getScreenInfo();
    const pos = await electronIpc.getWindowPosition();

    if (!screenInfo || !pos) return;

    const angle = Math.random() * Math.PI * 2;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const distance = 80 + Math.random() * 150;
    const duration = (distance / (30 * walkSpeed)) * 1000;

    const startTime = Date.now();
    const startX = pos.x;
    const startY = pos.y;

    setIsWandering(true);

    if (wanderStepRef.current) clearInterval(wanderStepRef.current);

    wanderStepRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      let curX = startX + dirX * distance * progress;
      let curY = startY + dirY * distance * progress;

      // Bounce at screen edges
      if (curX < screenInfo.x) curX = screenInfo.x;
      if (curX > screenInfo.x + screenInfo.width - pos.width) {
        curX = screenInfo.x + screenInfo.width - pos.width;
      }
      if (curY < screenInfo.y) curY = screenInfo.y;
      if (curY > screenInfo.y + screenInfo.height - pos.height) {
        curY = screenInfo.y + screenInfo.height - pos.height;
      }

      electronIpc.setWindowPos(Math.round(curX), Math.round(curY));

      if (progress >= 1) {
        clearInterval(wanderStepRef.current);
        wanderStepRef.current = null;
        setIsWandering(false);
      }
    }, 30);
  }, [walkSpeed, isDragging]);

  useEffect(() => {
    if (!autoWalkEnabled || isDragging) {
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);
      if (wanderStepRef.current) clearInterval(wanderStepRef.current);
      setIsWandering(false);
      return;
    }

    wanderIntervalRef.current = setInterval(() => {
      if (Math.random() < 0.6) {
        startWanderStep();
      }
    }, 4000);

    return () => {
      if (wanderIntervalRef.current) clearInterval(wanderIntervalRef.current);
      if (wanderStepRef.current) clearInterval(wanderStepRef.current);
    };
  }, [autoWalkEnabled, isDragging, startWanderStep]);

  return {
    isWandering,
    startWanderStep,
  };
}
