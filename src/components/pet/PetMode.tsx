import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AppSettings } from '../../types/settings';
import type { PetStats, PetState } from '../../types/pet';
import { usePetAnimation } from '../../hooks/usePetAnimation';
import { useWander } from '../../hooks/useWander';
import { useParticles } from '../../hooks/useParticles';
import { useKeySpy } from '../../hooks/useKeySpy';
import { PetCanvas } from './PetCanvas';
import { RadialMenu } from './RadialMenu';
import { ThoughtBubble } from './ThoughtBubble';
import { MessageWindow } from './MessageWindow';
import { AskInput } from './AskInput';
import { XPBar } from './XPBar';
import { FloatTextContainer } from './FloatTextContainer';
import { electronIpc } from '../../services/electronIpc';
import { aiService } from '../../services/aiProviders';
import { ttsService } from '../../services/ttsService';

interface PetModeProps {
  settings: AppSettings;
  stats: PetStats;
  onUpdateStats: (stats: PetStats) => void;
  onReturnToLauncher: () => void;
}

const FEED_COOLDOWN = 30 * 60 * 1000; // 30 minutes

export const PetMode: React.FC<PetModeProps> = ({
  settings,
  stats,
  onUpdateStats,
  onReturnToLauncher,
}) => {
  const {
    petState,
    setPetState,
    leftEyePos,
    rightEyePos,
    pawAngle,
    isDragging,
    setIsDragging,
    updateCursorTarget,
    triggerPawWave,
  } = usePetAnimation('idle');

  const { isWandering, startWanderStep } = useWander(settings.autoWalk, settings.walkSpeed, isDragging);
  const { particles, spawnParticles } = useParticles(settings.showParticles);
  const { floatingLetters } = useKeySpy(settings.floatLetters);

  const [menuVisible, setMenuVisible] = useState(false);
  const [thoughtText, setThoughtText] = useState('');
  const [thoughtVisible, setThoughtVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  const [askInputVisible, setAskInputVisible] = useState(false);
  const [xpBarVisible, setXpBarVisible] = useState(false);
  const [isWokenByShake, setIsWokenByShake] = useState(false);
  const [cookieSpamCount, setCookieSpamCount] = useState(0);
  const [fatScale, setFatScale] = useState(1);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const autoThinkTimerRef = useRef<any>(null);
  const sleepIntervalRef = useRef<any>(null);
  
  const [isStealingCursor, setIsStealingCursor] = useState(false);
  const stealTimerRef = useRef<any>(null);
  const stealPosRef = useRef<{ dx: number, dy: number } | null>(null);
  const cursorHoverTimeRef = useRef<number>(0);

  // Initialize sleep trait if missing
  useEffect(() => {
    if (!stats.sleepTrait) {
      const trait = Math.random() > 0.5 ? 'owl' : 'lark';
      onUpdateStats({ ...stats, sleepTrait: trait });
    }
  }, [stats.sleepTrait, stats, onUpdateStats]);

  // Sync wandering animation state
  useEffect(() => {
    if (isWandering && petState === 'idle') {
      setPetState('walking');
    } else if (!isWandering && petState === 'walking') {
      setPetState('idle');
    }
  }, [isWandering, petState, setPetState]);

  // Sync cursor position directly from Win32 GetCursorPos API & local mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateCursorTarget(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Direct polling of Win32 GetCursorPos via IPC (~50 FPS)
    const interval = setInterval(async () => {
      const pos = await electronIpc.getRelativeCursorPos();
      if (pos) {
        updateCursorTarget(pos.clientX, pos.clientY);
        
        if (isStealingCursor) {
          const winPos = await electronIpc.getWindowPosition();
          if (winPos && stealPosRef.current) {
            const petCenterX = winPos.width / 2;
            const petCenterY = winPos.height / 2;

            // Check if user is violently pulling the cursor away
            const dx = (pos.clientX * fatScale) - petCenterX;
            const dy = (pos.clientY * fatScale) - petCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 80) { // User jerked the mouse hard!
              setIsStealingCursor(false);
              if (stealTimerRef.current) clearTimeout(stealTimerRef.current);
              setThoughtText('Ой! Больно же, забирай! 😿');
              setThoughtVisible(true);
              if (settings.ttsEnabled) ttsService.speak('Ой! Больно же, забирай.');
              setTimeout(() => setThoughtVisible(false), 2000);
              setPetState('idle');
              return; // Stop stealing
            }

            const newX = winPos.x + stealPosRef.current.dx;
            const newY = winPos.y + stealPosRef.current.dy;
            electronIpc.setWindowPos(newX, newY);
            // Pin the OS cursor to the pet's hands/center
            electronIpc.setCursorPos(Math.round(newX + petCenterX), Math.round(newY + petCenterY));
          }
        } else {
          // Check if cursor is over the pet window
          const w = 320 * fatScale;
          const h = 300 * fatScale;
          if (pos.clientX >= 0 && pos.clientX <= w && pos.clientY >= 0 && pos.clientY <= h) {
            cursorHoverTimeRef.current += 20;
            if (cursorHoverTimeRef.current >= 3000 && petState === 'idle' && !isDragging && !menuVisible && !messageVisible) {
              setIsStealingCursor(true);
              cursorHoverTimeRef.current = 0;
              setThoughtText('МОЁ!');
              setThoughtVisible(true);
              setPetState('walking');
              
              if (settings.ttsEnabled) ttsService.speak('Моё!');
              
              stealPosRef.current = { 
                dx: (Math.random() - 0.5) * 20, 
                dy: (Math.random() - 0.5) * 20 
              };

              stealTimerRef.current = setTimeout(() => {
                setIsStealingCursor(false);
                setThoughtText('Фу, забирай...');
                setThoughtVisible(true);
                if (settings.ttsEnabled) ttsService.speak('Фу, забирай.');
                setTimeout(() => setThoughtVisible(false), 2000);
                setPetState('idle');
              }, 4000);
            }
          } else {
            cursorHoverTimeRef.current = 0;
          }
        }
      }
    }, 20);

    const unlisten = electronIpc.onCursorMove(pos => {
      updateCursorTarget(pos.clientX, pos.clientY);
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
      unlisten();
      if (stealTimerRef.current) clearTimeout(stealTimerRef.current);
    };
  }, [updateCursorTarget, isStealingCursor, fatScale, petState, isDragging, menuVisible, messageVisible, settings.ttsEnabled]);

  // Dynamically resize window when pet's scale changes
  useEffect(() => {
    electronIpc.resizePetWindow(fatScale);
  }, [fatScale]);

  // Automatic thinking timer
  useEffect(() => {
    if (!settings.autoThink) return;

    autoThinkTimerRef.current = setInterval(() => {
      if (petState === 'idle' && !menuVisible && !messageVisible) {
        const thoughts = [
          'Хочу печеньку...',
          'Где мой код?',
          'Сплю на клавиатуре...',
          'TypeScript — это круто!',
          'Ты тут?',
        ];
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        setThoughtText(randomThought);
        setThoughtVisible(true);
        setTimeout(() => setThoughtVisible(false), 4000);
      }
    }, 45000);

    return () => {
      if (autoThinkTimerRef.current) clearInterval(autoThinkTimerRef.current);
    };
  }, [settings.autoThink, petState, menuVisible, messageVisible]);

  // Sleep schedule check
  useEffect(() => {
    const checkSleep = () => {
      if (!stats.sleepTrait || petState === 'angry' || petState === 'burnt' || isDragging || isWokenByShake || isStealingCursor) return;

      const hour = new Date().getHours();
      let shouldSleep = false;

      if (stats.sleepTrait === 'owl' && hour >= 6 && hour < 14) {
        shouldSleep = true;
      } else if (stats.sleepTrait === 'lark' && (hour >= 22 || hour < 6)) {
        shouldSleep = true;
      }

      if (shouldSleep && petState !== 'sleep') {
        const typeStr = stats.sleepTrait === 'owl' ? 'сова' : 'жаворонок';
        setThoughtText(`Я ${typeStr}, сейчас мое время спать... 🥱`);
        setThoughtVisible(true);
        if (settings.ttsEnabled) ttsService.speak(`Я ${typeStr}, хочу спать.`);
        
        setTimeout(() => {
          setThoughtVisible(false);
          setPetState('sleep');
          spawnParticles(['z', 'Z', 'z'], 5, '#8AB8FF', { spread: 40, riseDistance: 100 });
        }, 3000);
      }
    };

    sleepIntervalRef.current = setInterval(checkSleep, 60000);
    checkSleep(); // initial check

    return () => {
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    };
  }, [stats.sleepTrait, petState, isDragging, isWokenByShake, isStealingCursor, settings.ttsEnabled, spawnParticles, setPetState]);

  const lastMousePosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const shakeVelocityRef = useRef<number>(0);
  const angryTimerRef = useRef<any>(null);
  const dizzyCounterRef = useRef<number>(0);
  const fallIntervalRef = useRef<any>(null);

  const ANGRY_CURSES = [
    'ТЫ ЧЁ, СУКА, ОХУЕЛ?! ДАЙ ПОСПАТЬ!!! 🤬',
    'БЛЯТЬ! КТО МЕНЯ ТРЯСЁТ, СУКА?! 🔥',
    'ЕБАТЬ ТЕБЯ В РУТ! Я СИДИК НАЖАЛ, ПОКА НЕ ДАШЬ ПЕЧЕНЬКУ, ХУЙ ТЕБЕ, А НЕ СОН! 💢',
    'ТЫ ШО, ДЕБИЛ?! ГОНИ ПЕЧЕНЬКУ ИЛИ Я ТВОЙ КОД УДАЛЮ! 🤬💥',
    'ОХУЕЛ В КРАЙ?! ЖРАТЬ ДАВАЙ ИЛИ СПАТЬ НЕ ЛЯГУ! 🖕🔥'
  ];

  // Feed action
  const feedPet = useCallback(() => {
    const now = Date.now();

    if (petState === 'burnt') {
      setThoughtText('Я призрак, призраки не едят печенье! 👻 (Потряси меня, чтобы воскресить)');
      setThoughtVisible(true);
      setTimeout(() => setThoughtVisible(false), 4000);
      return;
    }

    // If pet was woken up by shake, cookie calms it down completely!
    if (petState === 'angry' || isWokenByShake) {
      setIsWokenByShake(false);
      setCookieSpamCount(0);
      setFatScale(1);
      if (angryTimerRef.current) clearTimeout(angryTimerRef.current);

      let newXp = stats.xp + 15;
      let newLevel = stats.level;
      let newMaxXp = stats.maxXp;

      if (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.round(newMaxXp * 1.5);
      }

      onUpdateStats({
        ...stats,
        level: newLevel,
        xp: newXp,
        maxXp: newMaxXp,
        cookies: stats.cookies + 1,
        lastFeed: now,
      });

      spawnParticles(['cookie', 'heart', 'moon', 'sparkles'], 12, '#FF5252', { spread: 70, riseDistance: 130 });
      setThoughtText('Ням-ням... Ладно, хрен с тобой, сплю дальше 😴');
      setThoughtVisible(true);
      setPetState('happy');

      if (settings.ttsEnabled) {
        ttsService.speak('Ням ням. Ладно, сплю дальше.');
      }

      setTimeout(() => {
        setThoughtVisible(false);
        setPetState('sleep');
        spawnParticles(['z', 'Z', 'z'], 6, '#8AB8FF', { spread: 40, riseDistance: 100 });
      }, 2500);
      return;
    }

    if (now - stats.lastFeed < FEED_COOLDOWN) {
      const nextSpam = cookieSpamCount + 1;
      setCookieSpamCount(nextSpam);

      if (nextSpam === 1) {
        const remainingMs = FEED_COOLDOWN - (now - stats.lastFeed);
        const remainingMins = Math.ceil(remainingMs / 60000);
        setThoughtText(`Подожди ещё ${remainingMins} мин`);
        setThoughtVisible(true);
        setTimeout(() => setThoughtVisible(false), 3000);
      } else if (nextSpam === 2) {
        setThoughtText('Я сыт! Не надо меня пичкать! 😾');
        setThoughtVisible(true);
        setTimeout(() => setThoughtVisible(false), 3000);
      } else if (nextSpam === 3) {
        setThoughtText('Слышь, я ща лопну! Хватит тыкать! 😡');
        setThoughtVisible(true);
        setTimeout(() => setThoughtVisible(false), 3000);
      } else if (nextSpam === 4) {
        setThoughtText('ЕЩЁ РАЗ ТЫКНЕШЬ, И ТЕБЕ ХАНА! 🤬');
        setThoughtVisible(true);
        setTimeout(() => setThoughtVisible(false), 3000);
      } else {
        const newScale = fatScale + 0.25;
        if (newScale >= 2.0) {
          setPetState('burnt');
          setFatScale(1);
          setCookieSpamCount(0);
          spawnParticles(['flame', 'flame', 'skull', 'cookie', 'zap'], 30, '#FF3D00', { spread: 150, riseDistance: 180 });
          setThoughtText('БАБАХ!!! 💥 Я же говорил, что лопну! 💀');
          setThoughtVisible(true);
          if (settings.ttsEnabled) {
            ttsService.speak('Бабах! Я же говорил, что лопну.');
          }
          setTimeout(() => setThoughtVisible(false), 5000);
        } else {
          setFatScale(newScale);
          onUpdateStats({
            ...stats,
            cookies: stats.cookies + 1,
          });
          setPetState('happy');
          spawnParticles(['cookie', 'frown', 'sparkles'], 10, '#8D6E63', { spread: 60, riseDistance: 100 });

          let reaction = 'Ням... Ох... Кажется, я переел... 🤢';
          if (newScale >= 1.5) reaction = 'Ой-ёй... Я теперь круглый как колобок! 🎈';
          if (newScale >= 1.75) reaction = 'ПРЕКРАТИ! МНЕ ПЛОХО! СЕЙЧАС РЕАЛЬНО РВАНЁТ! 😰';

          setThoughtText(reaction);
          setThoughtVisible(true);

          if (settings.ttsEnabled) {
            ttsService.speak(reaction.replace(/[🤢🎈😰]/g, ''));
          }

          setTimeout(() => {
            setPetState('idle');
            setThoughtVisible(false);
          }, 3000);
        }
      }
      return;
    }

    setCookieSpamCount(0);
    setFatScale(1);

    let newXp = stats.xp + 10;
    let newLevel = stats.level;
    let newMaxXp = stats.maxXp;

    if (newXp >= newMaxXp) {
      newXp -= newMaxXp;
      newLevel += 1;
      newMaxXp = Math.round(newMaxXp * 1.5);
      spawnParticles(['star', 'LEVEL UP!', 'star'], 15, '#FFE082', { spread: 80, riseDistance: 160 });
    } else {
      spawnParticles(['cookie', 'heart', 'sparkles'], 8, '#FFB882', { spread: 50, riseDistance: 120 });
    }

    const nextStats: PetStats = {
      level: newLevel,
      xp: newXp,
      maxXp: newMaxXp,
      cookies: stats.cookies + 1,
      lastFeed: now,
    };

    onUpdateStats(nextStats);
    setPetState('happy');
    setXpBarVisible(true);

    setTimeout(() => {
      setPetState('idle');
      setTimeout(() => setXpBarVisible(false), 3000);
    }, 2000);
  }, [stats, onUpdateStats, setPetState, spawnParticles, petState, isWokenByShake, settings.ttsEnabled, cookieSpamCount, fatScale]);

  // Free fall logic
  const startFreeFall = async (startY: number) => {
    const screenInfo = await electronIpc.getScreenInfo();
    const pos = await electronIpc.getWindowPosition();
    if (!screenInfo || !pos) return;

    setPetState('falling');
    setThoughtText('ААААААА!');
    setThoughtVisible(true);
    if (settings.ttsEnabled) ttsService.speak('АААААААААААА!');

    let currentY = pos.y;
    const targetY = screenInfo.y + screenInfo.height - pos.height - 40;
    let velocity = 5;
    const gravity = 2;

    if (fallIntervalRef.current) clearInterval(fallIntervalRef.current);

    fallIntervalRef.current = setInterval(() => {
      velocity += gravity;
      currentY += velocity;

      if (currentY >= targetY) {
        currentY = targetY;
        clearInterval(fallIntervalRef.current);
        fallIntervalRef.current = null;

        electronIpc.setWindowPos(pos.x, currentY);

        setPetState('idle');
        spawnParticles(['dust', 'pow!', 'bang'], 15, '#9E9E9E', { spread: 100, riseDistance: 80 });
        setThoughtText('Шмяк...');
        setThoughtVisible(true);
        if (settings.ttsEnabled) ttsService.speak('Шмяк.');
        
        setTimeout(() => {
          setThoughtVisible(false);
        }, 2000);
      } else {
        electronIpc.setWindowPos(pos.x, currentY);
      }
    }, 20);
  };

  // Pointer Drag handling with pointer capture & safety fallbacks
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('#radial-menu') ||
      target.closest('#ask-input-container') ||
      target.closest('#message-window')
    ) {
      return;
    }
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    dragStartRef.current = { x: e.screenX, y: e.screenY };
    setIsDragging(true);
    electronIpc.startDrag(e.screenX, e.screenY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    electronIpc.moveWindow(e.screenX, e.screenY, true);

    const now = Date.now();
    if (lastMousePosRef.current) {
      const dt = (now - lastMousePosRef.current.time) / 1000;
      if (dt > 0.01) {
        const dx = e.screenX - lastMousePosRef.current.x;
        const dy = e.screenY - lastMousePosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = dist / dt;

        // Exponential smoothing of shake speed
        shakeVelocityRef.current = shakeVelocityRef.current * 0.6 + speed * 0.4;

        if (speed > 1800) {
          dizzyCounterRef.current += 1;
        } else if (speed < 500) {
          dizzyCounterRef.current = 0;
        }

        if (dizzyCounterRef.current > 15 && (petState === 'idle' || petState === 'walking' || petState === 'happy')) {
          setPetState('dizzy');
          dizzyCounterRef.current = 0;
          setThoughtText('Остановите Землю, я сойду... 🤢');
          setThoughtVisible(true);
          spawnParticles(['dizzy', 'spiral', 'star'], 10, '#8BC34A', { spread: 60, riseDistance: 100 });
          if (settings.ttsEnabled) {
            ttsService.speak('Остановите Землю, я сойду...');
          }
          setTimeout(() => {
            setPetState(prev => prev === 'dizzy' ? 'idle' : prev);
            setThoughtVisible(false);
          }, 4000);
          return;
        }

        if (petState === 'burnt' && shakeVelocityRef.current > 1800) {
          setPetState('idle');
          setFatScale(1);
          setCookieSpamCount(0);
          shakeVelocityRef.current = 0;
          setThoughtText('Ох... Спасибо, оттрясло! Свеж и готов к коду! 🧼');
          setThoughtVisible(true);
          spawnParticles(['sparkles', 'heart', 'star', 'sparkles'], 16, '#00E676', { spread: 80, riseDistance: 130 });
          if (settings.ttsEnabled) {
            ttsService.speak('Ох, спасибо, оттрясло! Свеж и готов к коду.');
          }
          setTimeout(() => setThoughtVisible(false), 3000);
          return;
        }

        if (petState === 'sleep' && shakeVelocityRef.current > 1800) {
          // SHAKE DETECTED! RAGE MODE ACTIVATED 🔥
          setPetState('angry');
          setIsWokenByShake(true);
          shakeVelocityRef.current = 0;

          const curse = ANGRY_CURSES[Math.floor(Math.random() * ANGRY_CURSES.length)];
          setThoughtText(curse);
          setThoughtVisible(true);

          spawnParticles(['flame', 'flame', 'alert', 'alert', 'zap'], 16, '#FF1744', { spread: 90, riseDistance: 150 });

          if (settings.ttsEnabled) {
            ttsService.speak(curse.replace(/[🤬🔥💢🖕💥]/g, ''));
          }
        }
      }
    }
    lastMousePosRef.current = { x: e.screenX, y: e.screenY, time: now };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        }
      } catch {}
      setIsDragging(false);
      
      const dropY = e.screenY;
      
      dragStartRef.current = null;
      electronIpc.endDrag();

      // Only fall if released at the very top of the screen (top 80 pixels)
      if (dropY < 80 && petState !== 'dizzy') {
        startFreeFall(dropY);
      }
    }
  };

  // Ensure drag state is always cleaned up on mouseup / window blur
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
        electronIpc.endDrag();
      }
    };

    window.addEventListener('pointerup', handleGlobalEnd);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('blur', handleGlobalEnd);
    return () => {
      window.removeEventListener('pointerup', handleGlobalEnd);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('blur', handleGlobalEnd);
      if (fallIntervalRef.current) clearInterval(fallIntervalRef.current);
    };
  }, [isDragging, setIsDragging]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.shiftKey) {
      onReturnToLauncher();
      return;
    }
    setMenuVisible(prev => !prev);
  };

  const handleRadialAction = async (action: 'sleep' | 'feed' | 'walk-toggle' | 'ask' | 'settings') => {
    setMenuVisible(false);

    if (action === 'sleep') {
      if (petState === 'angry' || isWokenByShake) {
        // Refuses to sleep until fed cookie!
        const refuseMsg = 'ХУЙ ТЕБЕ, А НЕ СОН! ПОКА ПЕЧЕНЬКУ НЕ ДАШЬ — НЕ ЛЯГУ! 🤬🍪';
        setThoughtText(refuseMsg);
        setThoughtVisible(true);
        spawnParticles(['alert', 'zap', 'help'], 8, '#FF1744', { spread: 60, riseDistance: 110 });
        if (settings.ttsEnabled) {
          ttsService.speak('Пока печеньку не дашь, не лягу!');
        }
        return;
      }
      setPetState('sleep');
      spawnParticles(['z', 'Z', 'z'], 5, '#8AB8FF', { spread: 40, riseDistance: 100 });
    } else if (action === 'feed') {
      feedPet();
    } else if (action === 'walk-toggle') {
      if (petState === 'angry') {
        setThoughtText(' КАКОЙ ГУЛЯТЬ?! ЖРАТЬ ДАВАЙ! 🤬');
        setThoughtVisible(true);
        return;
      }
      if (!isWandering) {
        startWanderStep();
      }
    } else if (action === 'ask') {
      setAskInputVisible(true);
    } else if (action === 'settings') {
      onReturnToLauncher();
    }
  };

  const handleSendAsk = async (question: string) => {
    setAskInputVisible(false);
    setPetState('thinking');
    setThoughtText('Думаю...');
    setThoughtVisible(true);

    try {
      const answer = await aiService.askAI(
        question,
        settings.provider,
        settings.apiKey,
        settings.selectedModel,
        settings.customUrl
      );

      setThoughtVisible(false);
      setMessageText(answer);
      setMessageVisible(true);
      setPetState('happy');

      if (settings.ttsEnabled) {
        ttsService.speak(answer);
      }

      setTimeout(() => {
        setPetState('idle');
      }, 3000);
    } catch (err: any) {
      setThoughtVisible(false);
      setMessageText(`Ошибка: ${err.message || 'Не удалось получить ответ'}`);
      setMessageVisible(true);
      setPetState('idle');
    }
  };

  return (
    <div id="pet-mode" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div id="pet-mode-inner">
        <div
          id="pet-container"
          className={`state-${petState} ${isDragging && petState !== 'dizzy' ? 'dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
          style={{
            transform: `scale(${fatScale})`,
            transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          <ThoughtBubble text={thoughtText} visible={thoughtVisible} />

          <PetCanvas
            petState={petState}
            petColor={settings.petColor}
            petOpacity={settings.petOpacity}
            leftEyePos={leftEyePos}
            rightEyePos={rightEyePos}
            pawAngle={pawAngle}
            isDragging={isDragging}
          />

          <RadialMenu
            visible={menuVisible}
            canAskAI={!!settings.apiKey}
            onAction={handleRadialAction}
          />

          <AskInput visible={askInputVisible} onSend={handleSendAsk} />

          <MessageWindow
            text={messageText}
            visible={messageVisible}
            onClose={() => setMessageVisible(false)}
          />

          <FloatTextContainer particles={particles} floatingLetters={floatingLetters} />

          <XPBar stats={stats} visible={xpBarVisible} />
        </div>
      </div>
    </div>
  );
};
