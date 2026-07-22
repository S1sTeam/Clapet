import React from 'react';
import type { PetState } from '../../types/pet';

interface PetCanvasProps {
  petState: PetState;
  petColor: string;
  petOpacity: number;
  leftEyePos: { x: number; y: number };
  rightEyePos: { x: number; y: number };
  pawAngle: number;
  isDragging: boolean;
}

export const PetCanvas: React.FC<PetCanvasProps> = ({
  petState,
  petColor,
  petOpacity,
  leftEyePos,
  rightEyePos,
  pawAngle,
  isDragging,
}) => {
  const isIdleOrWalk = petState === 'idle' || petState === 'walking';
  const isThinking = petState === 'thinking';
  const isHappy = petState === 'happy';
  const isSleep = petState === 'sleep';
  const isAngry = petState === 'angry';
  const isBurnt = petState === 'burnt';

  return (
    <svg
      id="pet-svg"
      viewBox="0 0 220 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: petOpacity }}
    >
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
        </filter>
        <filter id="angry-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FF0000" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Body */}
      <g id="body" className="body-part">
        <rect x="45" y="100" width="130" height="90" rx="0" fill={isBurnt ? '#2B2B2B' : (isAngry ? '#E74C3C' : petColor)} filter="url(#shadow)" />
        <rect x="55" y="110" width="110" height="60" rx="0" fill={isBurnt ? '#1A1A1A' : (isAngry ? '#922B21' : petColor)} opacity="0.2" />
      </g>

      {/* Head & Expressions */}
      <g id="head" className="head-part">
        {/* Normal eye tracking eyes */}
        <g
          className={`eye-group ${!isDragging && isIdleOrWalk ? '' : 'eye-hidden'}`}
          style={{ opacity: !isDragging && isIdleOrWalk ? 1 : 0 }}
        >
          <g id="eye-left">
            <rect id="eye-rect-left" x={leftEyePos.x} y={leftEyePos.y} width="30" height="20" rx="0" fill="#1A1A1A" />
          </g>
          <g id="eye-right">
            <rect id="eye-rect-right" x={rightEyePos.x} y={rightEyePos.y} width="30" height="20" rx="0" fill="#1A1A1A" />
          </g>
        </g>

        {/* Sleeping eyes */}
        <g id="sleep-eyes" className={isSleep ? '' : 'hidden'}>
          <rect x="76" y="143" width="24" height="3" rx="0" fill="#1A1A1A" transform="rotate(-3, 88, 144.5)" />
          <rect x="122" y="143" width="24" height="3" rx="0" fill="#1A1A1A" transform="rotate(3, 134, 144.5)" />
        </g>

        {/* Angry eyes & furious eyebrows */}
        <g id="angry-eyes" style={{ opacity: isAngry ? 1 : 0 }} filter="url(#angry-glow)">
          {/* Eyebrows angled inward down */}
          <polygon points="68,125 100,138 98,142 66,129" fill="#1A1A1A" />
          <polygon points="152,125 120,138 122,142 154,129" fill="#1A1A1A" />
          {/* Furious glowing red eyes with dark pupil */}
          <rect x="72" y="138" width="26" height="18" rx="0" fill="#FF1744" />
          <rect x="122" y="138" width="26" height="18" rx="0" fill="#FF1744" />
          <rect x="83" y="142" width="10" height="10" rx="0" fill="#000000" />
          <rect x="127" y="142" width="10" height="10" rx="0" fill="#000000" />
          {/* Fuming sharp mouth */}
          <polygon points="85,168 95,162 105,168 115,162 125,168 135,162 135,170 85,170" fill="#1A1A1A" />
        </g>

        {/* Burnt / Exploded state */}
        <g id="burnt-eyes" style={{ opacity: isBurnt ? 1 : 0 }}>
          {/* Left X */}
          <line x1="75" y1="135" x2="95" y2="155" stroke="#FF1744" strokeWidth="4" strokeLinecap="square" />
          <line x1="95" y1="135" x2="75" y2="155" stroke="#FF1744" strokeWidth="4" strokeLinecap="square" />
          {/* Right X */}
          <line x1="125" y1="135" x2="145" y2="155" stroke="#FF1744" strokeWidth="4" strokeLinecap="square" />
          <line x1="145" y1="135" x2="125" y2="155" stroke="#FF1744" strokeWidth="4" strokeLinecap="square" />
          {/* Dopey burnt mouth */}
          <line x1="100" y1="170" x2="120" y2="170" stroke="#FF1744" strokeWidth="3" strokeLinecap="square" />
        </g>

        {/* Mouth */}
        <g id="mouth" style={{ opacity: isHappy ? 1 : 0 }}>
          <path d="M 100 164 Q 110 172, 120 164" stroke="#1A1A1A" strokeWidth="2.5" fill="none" strokeLinecap="square" />
        </g>

        {/* Grabbed eyes */}
        <g id="grab-eyes" style={{ opacity: isDragging ? 1 : 0 }}>
          <polyline points="78,137 98,145 78,153" stroke="#1A1A1A" strokeWidth="5" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
          <polyline points="144,137 124,145 144,153" stroke="#1A1A1A" strokeWidth="5" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
        </g>

        {/* Happy eyes */}
        <g id="happy-eyes" style={{ opacity: isHappy ? 1 : 0 }}>
          <polyline points="82,147 88,139 94,147" stroke="#1A1A1A" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
          <polyline points="128,147 134,139 140,147" stroke="#1A1A1A" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
        </g>
      </g>

      {/* Thinking eyes */}
      <g id="think-eyes" style={{ opacity: isThinking ? 1 : 0 }}>
        <circle cx="88" cy="137" r="5" fill="#1A1A1A" />
        <circle cx="134" cy="137" r="5" fill="#1A1A1A" />
      </g>

      {/* Glasses */}
      <g id="glasses" style={{ opacity: isThinking ? 1 : 0 }}>
        <circle cx="88" cy="139" r="13" stroke="#333" strokeWidth="2.5" fill="none" />
        <circle cx="134" cy="139" r="13" stroke="#333" strokeWidth="2.5" fill="none" />
        <path d="M 101 139 Q 111 136, 121 139" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="square" />
        <line x1="75" y1="135" x2="66" y2="128" stroke="#333" strokeWidth="2.5" strokeLinecap="square" />
        <line x1="147" y1="135" x2="156" y2="128" stroke="#333" strokeWidth="2.5" strokeLinecap="square" />
      </g>

      {/* Legs */}
      <g id="legs" className="legs-part">
        <rect id="leg-fl" x="58" y="185" width="14" height="22" rx="0" fill={isBurnt ? '#2B2B2B' : (isAngry ? '#E74C3C' : petColor)} />
        <rect id="leg-bl" x="80" y="185" width="14" height="22" rx="0" fill={isBurnt ? '#2B2B2B' : (isAngry ? '#E74C3C' : petColor)} />
        <rect id="leg-fr" x="128" y="185" width="14" height="22" rx="0" fill={isBurnt ? '#2B2B2B' : (isAngry ? '#E74C3C' : petColor)} />
        <rect id="leg-br" x="150" y="185" width="14" height="22" rx="0" fill={isBurnt ? '#2B2B2B' : (isAngry ? '#E74C3C' : petColor)} />
      </g>

      {/* Left paw with animation */}
      <g
        id="left-paw"
        className="paw left-paw"
        transform={pawAngle !== 0 ? `rotate(${pawAngle.toFixed(1)}, 42, 142)` : undefined}
      >
        <rect x="25" y="132" width="20" height="20" rx="0" fill={isBurnt ? '#2B2B2B' : (isAngry ? '#E74C3C' : petColor)} />
      </g>

      {/* Right paw */}
      <g id="right-paw" className="paw right-paw">
        <rect x="175" y="132" width="20" height="20" rx="0" fill={isBurnt ? '#2B2B2B' : (isAngry ? '#E74C3C' : petColor)} />
      </g>
    </svg>
  );
};
