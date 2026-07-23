import React from 'react';

interface PetSvgProps {
  state: 'idle' | 'thinking' | 'happy' | 'sleep' | 'walking';
  isDragging: boolean;
  eyeOffset: { x: number; y: number };
  leftPawTransform: string;
}

export const PetSvg: React.FC<PetSvgProps> = ({
  state,
  isDragging,
  eyeOffset,
  leftPawTransform,
}) => {
  const isEyeNormal = !isDragging && (state === 'idle' || state === 'walking');
  const isGrab = isDragging;
  const isThink = !isDragging && state === 'thinking';
  const isHappy = !isDragging && state === 'happy';

  return (
    <svg id="pet-svg" viewBox="0 0 220 240">
      <defs>
        <radialGradient id="shadow-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse className="pet-shadow" cx="110" cy="208" rx="70" ry="10" fill="url(#shadow-grad)" />

      <g id="body-parts" className="body-part">
        <rect id="body-rect" x="45" y="100" width="130" height="90" rx="0" fill="#df7959" />

        <rect id="belly-rect" x="55" y="110" width="110" height="60" rx="0" fill="#df7959" opacity="0.2" />

        <g id="mouth" className={`mouth-part ${!isHappy ? 'eye-hidden' : ''}`} style={{ opacity: isHappy ? 1 : 0 }}>
          <path d="M 98 152 Q 110 162, 122 152" stroke="#1A1A1A" strokeWidth="4" fill="none" strokeLinecap="square" />
        </g>

        <g className={`eye-group ${!isEyeNormal ? 'eye-hidden' : ''}`} style={{ opacity: isEyeNormal ? 1 : 0 }}>
          <rect
            id="eye-rect-left"
            x={73 + eyeOffset.x}
            y={135 + eyeOffset.y}
            width="30"
            height="20"
            rx="0"
            fill="#1A1A1A"
          />
          <rect
            id="eye-rect-right"
            x={119 + eyeOffset.x}
            y={135 + eyeOffset.y}
            width="30"
            height="20"
            rx="0"
            fill="#1A1A1A"
          />
        </g>

        <g id="grab-eyes" className={!isGrab ? 'eye-hidden' : ''} style={{ opacity: isGrab ? 1 : 0 }}>
          <polyline points="78,137 98,145 78,153" stroke="#1A1A1A" strokeWidth="5" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
          <polyline points="144,137 124,145 144,153" stroke="#1A1A1A" strokeWidth="5" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
        </g>

        <g id="happy-eyes" className={!isHappy ? 'eye-hidden' : ''} style={{ opacity: isHappy ? 1 : 0 }}>
          <polyline points="82,147 88,139 94,147" stroke="#1A1A1A" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
          <polyline points="128,147 134,139 140,147" stroke="#1A1A1A" strokeWidth="4" fill="none" strokeLinecap="square" strokeLinejoin="miter" />
        </g>
      </g>

      <g id="think-eyes" className={!isThink ? 'eye-hidden' : ''} style={{ opacity: isThink ? 1 : 0 }}>
        <circle cx="88" cy="137" r="5" fill="#1A1A1A" />
        <circle cx="134" cy="137" r="5" fill="#1A1A1A" />
      </g>

      <g id="glasses" className={!isThink ? 'eye-hidden' : ''} style={{ opacity: isThink ? 1 : 0 }}>
        <circle cx="88" cy="139" r="13" stroke="#333" strokeWidth="2.5" fill="none" />
        <circle cx="134" cy="139" r="13" stroke="#333" strokeWidth="2.5" fill="none" />
        <path d="M 101 139 Q 111 136, 121 139" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="square" />
        <line x1="75" y1="135" x2="66" y2="128" stroke="#333" strokeWidth="2.5" strokeLinecap="square" />
        <line x1="147" y1="135" x2="156" y2="128" stroke="#333" strokeWidth="2.5" strokeLinecap="square" />
      </g>

      <g id="legs" className="legs-part">
        <rect id="leg-fl" x="58" y="185" width="14" height="22" rx="0" fill="#df7959" />
        <rect id="leg-bl" x="80" y="185" width="14" height="22" rx="0" fill="#df7959" />
        <rect id="leg-fr" x="128" y="185" width="14" height="22" rx="0" fill="#df7959" />
        <rect id="leg-br" x="150" y="185" width="14" height="22" rx="0" fill="#df7959" />
      </g>

      <g id="left-paw" className="paw left-paw" transform={leftPawTransform}>
        <rect x="25" y="132" width="20" height="20" rx="0" fill="#df7959" />
      </g>
      <g id="right-paw" className="paw right-paw">
        <rect x="175" y="132" width="20" height="20" rx="0" fill="#df7959" />
      </g>
    </svg>
  );
};
