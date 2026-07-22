const { ipcRenderer } = require('electron');

document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
  if (e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey &&
       (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
    e.preventDefault();
  }
});

Object.defineProperty(navigator, 'userAgent', {
  get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  configurable: false,
});
Object.defineProperty(navigator, 'appVersion', {
  get: () => '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  configurable: false,
});
Object.defineProperty(navigator, 'platform', {
  get: () => 'Win32',
  configurable: false,
});

if (typeof process !== 'undefined' && process.versions) {
  delete process.versions.electron;
}
if (typeof process !== 'undefined') {
  delete process.type;
}

window.addEventListener('error', (e) => {
  console.error('RENDERER ERROR:', e.error ? e.error.stack || e.error.message : e.message);
});

// --- Drag handling ---
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;
let hasMoved = false;
const DRAG_THRESHOLD = 3;

const container = document.getElementById('pet-container');

container.addEventListener('mousedown', (e) => {
  try {
    if (e.button !== 0) return;
    setState(PET_STATES.IDLE);
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    isDragging = true;
    hasMoved = false;
    container.style.cursor = 'grabbing';
    container.classList.add('dragging');
    eyeGroup.style.opacity = '0';
    eyeGroup.classList.add('eye-hidden');
    glasses.style.opacity = '0';
    glasses.classList.add('eye-hidden');
    grabEyes.style.opacity = '1';
    grabEyes.classList.remove('eye-hidden');
    if (wanderEnabled) pauseWander();
    ipcRenderer.send('start-drag');
  } catch (err) { console.error('mousedown error:', err); }
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const deltaX = e.screenX - dragStartX;
  const deltaY = e.screenY - dragStartY;
  const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (dist > DRAG_THRESHOLD) {
    hasMoved = true;
    ipcRenderer.send('move-window', { deltaX, deltaY });
    dragStartX = e.screenX;
    dragStartY = e.screenY;
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    container.style.cursor = 'default';
    isDragging = false;
    hasMoved = false;
    container.classList.remove('dragging');
    grabEyes.style.opacity = '0';
    grabEyes.classList.add('eye-hidden');
    eyeGroup.style.opacity = '1';
    eyeGroup.classList.remove('eye-hidden');
    ipcRenderer.send('end-drag');
    if (wanderEnabled) {
      getCurrentPos().then(pos => { if (pos) wanderPos = { x: pos.x, y: pos.y }; });
      resumeWander();
    }
  }
});

// --- Animation states ---
const PET_STATES = {
  IDLE: 'idle',
  THINKING: 'thinking',
  HAPPY: 'happy',
  SLEEP: 'sleep',
  WALKING: 'walking',
};

const eyeLeft = document.getElementById('eye-rect-left');
const eyeRight = document.getElementById('eye-rect-right');
const eyeGroup = document.querySelector('.eye-group');
const grabEyes = document.getElementById('grab-eyes');
const thinkEyes = document.getElementById('think-eyes');
const happyEyes = document.getElementById('happy-eyes');
const glasses = document.getElementById('glasses');
const mouth = document.getElementById('mouth');
const mouthPath = document.querySelector('#mouth path');
const thoughtBubble = document.getElementById('thought-bubble');
const thoughtText = document.getElementById('thought-text');
const leftPaw = document.getElementById('left-paw');

const EYE_BASES = {
  left: { x: 73, y: 135, w: 30, h: 20 },
  right: { x: 119, y: 135, w: 30, h: 20 },
};
const EYE_MAX_MOVE = 12;

let currentState = 'idle';
let idleTimer = null;
let sleepInterval = null;
let chewInterval = null;
let eyeRafRunning = false;

function setState(state) {
  if (currentState === PET_STATES.SLEEP && state !== PET_STATES.SLEEP) {
    clearInterval(sleepInterval);
    sleepInterval = null;
  }
  if (currentState === PET_STATES.HAPPY && state !== PET_STATES.HAPPY) {
    stopChewing();
  }
  currentState = state;
  container.className = 'state-' + state;
  resetIdleTimer();
  if (state === PET_STATES.SLEEP) {
    thoughtBubble.classList.add('hidden');
  }

  [eyeGroup, grabEyes, thinkEyes, happyEyes, glasses, mouth].forEach(el => {
    el.style.opacity = '0';
    el.classList.add('eye-hidden');
  });

  if (state === PET_STATES.IDLE) {
    eyeGroup.style.opacity = '1';
    eyeGroup.classList.remove('eye-hidden');
    if (!eyeRafRunning) {
      eyeRafRunning = true;
      requestAnimationFrame(updateEyesSmooth);
    }
  } else if (state === PET_STATES.THINKING) {
    thinkEyes.style.opacity = '1';
    thinkEyes.classList.remove('eye-hidden');
    glasses.style.opacity = '1';
    glasses.classList.remove('eye-hidden');
  } else if (state === PET_STATES.HAPPY) {
    happyEyes.style.opacity = '1';
    happyEyes.classList.remove('eye-hidden');
    mouth.style.opacity = '1';
    mouth.classList.remove('eye-hidden');
  } else if (state === PET_STATES.WALKING) {
    eyeGroup.style.opacity = '1';
    eyeGroup.classList.remove('eye-hidden');
    if (!eyeRafRunning) {
      eyeRafRunning = true;
      requestAnimationFrame(updateEyesSmooth);
    }
  }
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  leftPaw.setAttribute('transform', '');
  if (currentState === PET_STATES.IDLE) {
    idleTimer = setTimeout(() => {
      if (currentState === PET_STATES.IDLE) {
        startPawWave();
      }
    }, 60000);
  }
}

function startPawWave() {
  try {
    const cx = 42, cy = 142;
    const keyframes = [
      { angle: 0, t: 0 },
      { angle: 60, t: 0.35 },
      { angle: -10, t: 0.55 },
      { angle: 40, t: 0.75 },
      { angle: 0, t: 1 },
    ];
    const duration = 1400;
    let start = null;

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function frame(now) {
      if (!start) start = now;
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);

      let i = 0;
      while (i < keyframes.length - 1 && keyframes[i + 1].t <= p) i++;
      if (i >= keyframes.length - 1) {
        leftPaw.setAttribute('transform', '');
        resetIdleTimer();
        return;
      }
      const a = keyframes[i], b = keyframes[i + 1];
      const local = (p - a.t) / (b.t - a.t);
      const angle = a.angle + (b.angle - a.angle) * easeInOut(local);
      leftPaw.setAttribute('transform', `rotate(${angle.toFixed(1)}, ${cx}, ${cy})`);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  } catch (err) { console.error('wave error:', err); }
}
function wakeUp() {
  if (currentState === PET_STATES.SLEEP) {
    setState(PET_STATES.IDLE);
    resetLegs();
  }
}

// --- Eye tracking (black rectangles move on body, global cursor) ---
const BODY_BOUNDS = { x1: 45, y1: 100, x2: 175, y2: 190 };

let targetX = 0, targetY = 0;
let currentEyeX = 0, currentEyeY = 0;

ipcRenderer.on('cursor-move', (e, { clientX, clientY }) => {
  targetX = clientX;
  targetY = clientY;
});

function lerp(a, b, t) { return a + (b - a) * t; }

function updateEyesSmooth() {
  if (currentState !== PET_STATES.IDLE && currentState !== PET_STATES.WALKING) { eyeRafRunning = false; return; }

  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  let dx = targetX - centerX;
  let dy = targetY - centerY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0) { dx /= dist; dy /= dist; }

  const targetMoveX = dx * EYE_MAX_MOVE;
  const targetMoveY = dy * EYE_MAX_MOVE * 2;

  currentEyeX = lerp(currentEyeX, targetMoveX, 0.15);
  currentEyeY = lerp(currentEyeY, targetMoveY, 0.15);

  let lx = EYE_BASES.left.x + currentEyeX;
  let ly = EYE_BASES.left.y + currentEyeY;
  let rx = EYE_BASES.right.x + currentEyeX;
  let ry = EYE_BASES.right.y + currentEyeY;

  const ew = EYE_BASES.left.w;
  const eh = EYE_BASES.left.h;

  lx = Math.max(BODY_BOUNDS.x1, Math.min(BODY_BOUNDS.x2 - ew, lx));
  ly = Math.max(BODY_BOUNDS.y1, Math.min(BODY_BOUNDS.y2 - eh, ly));
  rx = Math.max(BODY_BOUNDS.x1 + (EYE_BASES.right.x - EYE_BASES.left.x), Math.min(BODY_BOUNDS.x2 - ew, rx));
  ry = Math.max(BODY_BOUNDS.y1, Math.min(BODY_BOUNDS.y2 - eh, ry));

  eyeLeft.setAttribute('x', lx);
  eyeLeft.setAttribute('y', ly);
  eyeRight.setAttribute('x', rx);
  eyeRight.setAttribute('y', ry);

  requestAnimationFrame(updateEyesSmooth);
}

// --- Click reactions ---
const radialMenu = document.getElementById('radial-menu');
const walkBtn = document.getElementById('walk-btn');

function positionRadialButtons() {
  const buttons = radialMenu.querySelectorAll('.radial-btn:not(.hidden)');
  const count = buttons.length;
  if (!count) return;
  const w = radialMenu.offsetWidth;
  const h = radialMenu.offsetHeight;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 72;
  const startAngle = -90;
  let feedBtnPos = null;
  buttons.forEach((btn, i) => {
    const angle = startAngle + (360 / count) * i;
    const rad = (angle * Math.PI) / 180;
    const left = cx + radius * Math.cos(rad);
    const top = cy + radius * Math.sin(rad);
    btn.style.left = left + 'px';
    btn.style.top = top + 'px';
    btn.style.transitionDelay = (i * 0.035) + 's';
    if (btn.id === 'feed-btn') feedBtnPos = { left, top };
  });
  if (feedBtnPos && feedTimer) {
    feedTimer.style.left = feedBtnPos.left + 'px';
    feedTimer.style.top = (feedBtnPos.top + 22) + 'px';
  }
}

function showMenu() {
  const askBtn = document.getElementById('ask-btn');
  if (askBtn) askBtn.classList.toggle('hidden', !verifiedModel);
  radialMenu.classList.remove('hidden');
  positionRadialButtons();
  updateFeedTimer();
  requestAnimationFrame(() => {
    radialMenu.classList.add('visible');
  });
  thoughtBubble.classList.add('hidden');
}

function hideMenu(immediate) {
  radialMenu.classList.remove('visible');
  const buttons = radialMenu.querySelectorAll('.radial-btn');
  buttons.forEach(b => b.style.transitionDelay = '0s');
  if (immediate) radialMenu.classList.add('hidden');
  else setTimeout(() => { if (!radialMenu.classList.contains('visible')) radialMenu.classList.add('hidden'); }, 250);
}

document.addEventListener('click', (e) => {
  if (hasMoved) return;

  if (radialMenu.classList.contains('visible')) {
    hideMenu();
    return;
  }

  if (container.contains(e.target)) {
    wakeUp();
  }
});

container.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (e.shiftKey) { returnToLauncher(); return; }
  showMenu();
});

radialMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  const item = e.target.closest('.radial-btn');
  if (!item) return;

  const action = item.dataset.action;
  hideMenu();

  switch (action) {
    case 'think':
      thoughtBubble.classList.remove('hidden');
      thoughtText.textContent = '...';
      setState(PET_STATES.THINKING);
      spawnParticles(['?', '?', '¿'], 5, '#8ab4f8', { spread: 40, riseDistance: 130 });
      setTimeout(() => {
        thoughtBubble.classList.add('hidden');
        if (currentState === PET_STATES.THINKING) setState(PET_STATES.IDLE);
      }, 6000);
      break;
    case 'happy':
      setState(PET_STATES.HAPPY);
      spawnParticles(['★', '✦', '♥', '✧'], 12, '#FFD700', { spread: 70, riseDistance: 150, sizeRange: [16, 28] });
      setTimeout(() => setState(PET_STATES.IDLE), 1500);
      break;
    case 'sleep':
      setState(PET_STATES.SLEEP);
      sleepInterval = setInterval(() => {
        const z = ['z', 'Z', 'z'];
        spawnParticles(z, 1, '#a8c8ff', { spread: 50, riseDistance: 100, sizeRange: [14, 22], startY: 'bottom' });
      }, 400);
      break;
    case 'feed':
      if (!canFeed()) {
        const _fd = getXPData();
        const _fr = FEED_COOLDOWN - (Date.now() - _fd.lastFeed);
        const _fm = Math.ceil(_fr / 60000);
        const _fs = Math.ceil((_fr % 60000) / 1000);
        thoughtBubble.classList.remove('hidden');
        thoughtText.textContent = _fm > 0 ? `Подожди ещё ${_fm} мин` : `Подожди ещё ${_fs} сек`;
        setTimeout(() => thoughtBubble.classList.add('hidden'), 3000);
      } else {
        const _fd = getXPData();
        _fd.lastFeed = Date.now();
        saveXPData(_fd);
        spawnCookie();
      }
      break;
    case 'settings':
      showSettings();
      break;
    case 'ask':
      showAskInput();
      break;
    case 'walk-toggle':
      toggleWander();
      break;
  }
});

// --- Floating typing letters ---
const floatContainer = document.getElementById('float-text-container');
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (currentState === PET_STATES.SLEEP) return;
  if (!askInputContainer.classList.contains('hidden') && askInputContainer.contains(e.target)) {
    spawnFloatLetter(e.key);
  }
});

function spawnFloatLetter(key) {
  if (localStorage.getItem('float_letters') === '0') return;
  const charMap = {
    ' ': '␣',
    'SPACE': '␣',
    'ENTER': '↵',
    'TAB': '⇥',
    'BACKSPACE': '⌫',
    'SHIFT': '⇧',
    'CONTROL': '⌃',
    'ALT': '⌥',
    'CAPS LOCK': '⇪',
    'DELETE': '⌦',
    'ESCAPE': '⎋',
  };

  const upper = key.toUpperCase();
  let display = upper;
  if (display.length === 1 && LETTERS.includes(display)) {
  } else if (charMap[display]) {
    display = charMap[display];
  } else if (display.length > 1 || display === '') {
    return;
  }

  const el = document.createElement('div');
  el.className = 'float-letter';
  el.textContent = display;

  const w = floatContainer.offsetWidth || 220;
  const margin = 30;
  const x = margin + Math.random() * Math.max(1, w - margin * 2);
  el.style.left = x + 'px';
  el.style.fontSize = (14 + Math.random() * 8) + 'px';

  floatContainer.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.remove(); }, 1400);
}

// --- Particle system ---
function spawnParticles(chars, count, color, opts = {}) {
  if (localStorage.getItem('particles_enabled') === '0') return;
  const { spread = 40, riseDistance = 120, sizeRange = [12, 22], startY = 'center' } = opts;
  const w = floatContainer.offsetWidth || 220;
  const margin = 20;

  const yPos = startY === 'bottom' ? '15%' : startY === 'top' ? '75%' : '45%';

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.color = color;
    el.style.textShadow = `0 0 10px ${color}66, 0 0 30px ${color}33`;
    el.style.bottom = yPos;
    const x = margin + Math.random() * Math.max(1, w - margin * 2);
    el.style.left = x + 'px';
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    el.style.fontSize = size + 'px';
    el.style.setProperty('--rise', riseDistance + 'px');
    el.style.setProperty('--drift', (Math.random() - 0.5) * spread * 0.5 + 'px');
    el.style.animationDuration = (1 + Math.random() * 0.5) + 's';
    floatContainer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 1800);
  }
}

function spawnCookie() {
  const el = document.createElement('div');
  el.className = 'cookie-fly';
  el.textContent = '🍪';
  floatContainer.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.remove();

    setState(PET_STATES.HAPPY);
    startChewing();

    thoughtBubble.classList.remove('hidden');
    thoughtText.textContent = 'Yummy! 🍪';
    spawnParticles(['♥', '♥', '❤'], 6, '#ff6b8a', { spread: 50, riseDistance: 120, sizeRange: [16, 24] });
    addXP(XP_PER_COOKIE);
    updateXpBar(true);

    const xpFloat = document.createElement('div');
    xpFloat.textContent = '+' + XP_PER_COOKIE;
    xpFloat.style.cssText = 'position:absolute;top:-40px;left:50%;transform:translateX(-50%);font-family:Segoe UI Variable,Segoe UI,sans-serif;font-size:20px;font-weight:700;color:var(--success);text-shadow:0 2px 8px rgba(0,0,0,0.5);z-index:35;pointer-events:none;animation:xp-float 1.4s ease-out forwards;';
    const xpBarContainer = document.getElementById('xp-bar-container');
    if (xpBarContainer) xpBarContainer.appendChild(xpFloat);
    setTimeout(() => { if (xpFloat.parentNode) xpFloat.remove(); }, 1500);

    setTimeout(() => {
      stopChewing();
      thoughtBubble.classList.add('hidden');
      setState(PET_STATES.IDLE);
    }, 10000);
  }, 600);
}

// --- Chewing animation ---
const MOUTH_CLOSED = "M 100 164 Q 110 168, 120 164";
const MOUTH_OPEN   = "M 100 165 Q 110 178, 120 165";

function startChewing() {
  let open = false;
  chewInterval = setInterval(() => {
    open = !open;
    mouthPath.setAttribute('d', open ? MOUTH_OPEN : MOUTH_CLOSED);
  }, 180);
}

function stopChewing() {
  clearInterval(chewInterval);
  chewInterval = null;
  mouthPath.setAttribute('d', "M 100 164 Q 110 172, 120 164");
}

// --- AI Chat Module ---
async function fetchWithTimeout(url, opts, ms = 30000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

const PROVIDERS = {
  openai: {
    name: 'OpenAI', baseURL: 'https://api.openai.com/v1',
    defaultModels: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 1024 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  groq: {
    name: 'Groq', baseURL: 'https://api.groq.com/openai/v1',
    defaultModels: [
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 1024 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  openrouter: {
    name: 'OpenRouter', baseURL: 'https://openrouter.ai/api/v1',
    defaultModels: [
      { id: 'openrouter/auto', name: 'Auto (best model)' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.name || m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 1024 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  anthropic: {
    name: 'Anthropic', baseURL: 'https://api.anthropic.com/v1',
    defaultModels: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-haiku-3-20250313', name: 'Claude Haiku 3' },
    ],
    listModels: async (baseURL, key) => {
      try {
        const res = await fetchWithTimeout(`${baseURL}/models`, {
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('not supported');
        const data = await res.json();
        return data.data.map(m => ({ id: m.id, name: m.display_name || m.id }));
      } catch (e) { return null; }
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/messages`, {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 1024, messages: [{ role: 'user', content: text }] })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.content[0].text;
    }
  },
  gemini: {
    name: 'Gemini', baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModels: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models?key=${key}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.models
        .filter(m => m.name.includes('gemini'))
        .map(m => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name.replace('models/', '') }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
  },
  deepseek: {
    name: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1',
    defaultModels: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 4096 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  mistral: {
    name: 'Mistral', baseURL: 'https://api.mistral.ai/v1',
    defaultModels: [
      { id: 'mistral-large-latest', name: 'Mistral Large' },
      { id: 'mistral-small-latest', name: 'Mistral Small' },
      { id: 'open-mistral-nemo', name: 'Mistral Nemo' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 4096 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  together: {
    name: 'Together AI', baseURL: 'https://api.together.xyz/v1',
    defaultModels: [
      { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', name: 'Mixtral 8x7B' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.map(m => ({ id: m.id, name: m.name || m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 4096 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  perplexity: {
    name: 'Perplexity', baseURL: 'https://api.perplexity.ai',
    defaultModels: [
      { id: 'sonar-pro', name: 'Sonar Pro' },
      { id: 'sonar', name: 'Sonar' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 4096 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  xai: {
    name: 'xAI (Grok)', baseURL: 'https://api.x.ai/v1',
    defaultModels: [
      { id: 'grok-2-latest', name: 'Grok 2' },
      { id: 'grok-beta', name: 'Grok Beta' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 4096 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  github: {
    name: 'GitHub Models', baseURL: 'https://models.inference.ai.azure.com',
    defaultModels: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
    ],
    listModels: async (baseURL, key) => {
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.data.map(m => ({ id: m.id, name: m.id }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 4096 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  },
  custom: {
    name: 'Custom', baseURL: '',
    defaultModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (fallback)' },
    ],
    listModels: async (baseURL, key) => {
      if (!baseURL) throw new Error('No base URL');
      const res = await fetchWithTimeout(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return (data.data || data.models || []).map(m => ({ id: m.id || m.name, name: m.id || m.name }));
    },
    sendMessage: async (baseURL, key, model, text) => {
      const res = await fetchWithTimeout(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: text }], max_tokens: 4096 })
      });
      if (!res.ok) { const err = await res.text(); throw new Error(`HTTP ${res.status}: ${err}`); }
      const data = await res.json();
      return data.choices[0].message.content;
    }
  }
};

let currentProvider = 'openai';
let savedKey = '';
let verifiedModel = '';

const settingsPanel = document.getElementById('settings-panel');
const providerSelect = document.getElementById('provider-select');
const apiKeyInput = document.getElementById('api-key-input');
const verifyBtn = document.getElementById('verify-key-btn');
const keyStatus = document.getElementById('key-status');
const modelRow = document.getElementById('model-row');
const modelSelect = document.getElementById('model-select');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const askInputContainer = document.getElementById('ask-input-container');
const askInput = document.getElementById('ask-input');
const askSendBtn = document.getElementById('ask-send-btn');
const messageWindow = document.getElementById('message-window');
const messageContent = document.getElementById('message-content');
const customUrlRow = document.getElementById('custom-url-row');
const customUrlInput = document.getElementById('custom-url-input');
const modelInput = document.getElementById('model-input');

function populateModelSelect() {
  modelSelect.innerHTML = '';
  const defaults = PROVIDERS[currentProvider]?.defaultModels || [];
  const allModels = [...defaults];
  if (verifiedModel && !allModels.some(m => m.id === verifiedModel)) {
    allModels.push({ id: verifiedModel, name: verifiedModel });
  }
  allModels.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name || m.id;
    modelSelect.appendChild(opt);
  });
  if (verifiedModel && allModels.some(m => m.id === verifiedModel)) {
    modelSelect.value = verifiedModel;
  }
}

try {
  const saved = localStorage.getItem('pet_ai_settings');
  if (saved) {
    const s = JSON.parse(saved);
    if (s.provider) { currentProvider = s.provider; providerSelect.value = currentProvider; }
    if (s.key) { savedKey = s.key; apiKeyInput.value = s.key; }
    if (s.model) { verifiedModel = s.model; }
    if (s.customUrl) { customUrlInput.value = s.customUrl; }
  }
  if (currentProvider === 'custom') customUrlRow.style.display = 'flex';
  if (verifiedModel) populateModelSelect();
} catch (e) {}

function saveSettings() {
  try {
    localStorage.setItem('pet_ai_settings', JSON.stringify({
      provider: currentProvider, key: savedKey, model: verifiedModel, customUrl: customUrlInput.value.trim(),
    }));
  } catch (e) {}
}

function showSettings() {
  settingsPanel.classList.remove('hidden');
  if (customUrlRow) customUrlRow.style.display = currentProvider === 'custom' ? 'flex' : 'none';
  if (verifiedModel) {
    modelRow.style.display = 'flex';
    populateModelSelect();
  }
}

function hideSettings() {
  settingsPanel.classList.add('hidden');
}

providerSelect.addEventListener('change', () => {
  currentProvider = providerSelect.value;
  customUrlRow.style.display = currentProvider === 'custom' ? 'flex' : 'none';
  modelRow.style.display = 'none';
  modelInput.style.display = 'none';
  keyStatus.textContent = '';
  verifiedModel = '';
  saveSettings();
});

verifyBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) { keyStatus.textContent = 'Enter an API key'; keyStatus.style.color = '#ff6b6b'; return; }

  let baseURL = PROVIDERS[currentProvider].baseURL;
  if (currentProvider === 'custom') {
    baseURL = customUrlInput.value.trim();
    if (!baseURL) { keyStatus.textContent = 'Enter a Base URL'; keyStatus.style.color = '#ff6b6b'; return; }
  }

  verifyBtn.disabled = true;
  keyStatus.textContent = 'Verifying...';
  keyStatus.style.color = '#aaa';
  savedKey = key;
  modelSelect.innerHTML = '';
  modelInput.style.display = 'none';

  let models = null;
  try {
    const prov = currentProvider === 'custom'
      ? { listModels: PROVIDERS.custom.listModels }
      : PROVIDERS[currentProvider];
    models = await prov.listModels(baseURL, key);
    modelInput.style.display = 'none';
  } catch (e) {
    console.warn('List models failed:', e.message);
    if (currentProvider === 'custom') {
      modelInput.style.display = 'block';
      modelInput.value = verifiedModel || '';
    }
  }
  const list = (models && models.length > 0) ? models : [];
  list.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name || m.id;
    modelSelect.appendChild(opt);
  });
  modelRow.style.display = 'flex';
  if (verifiedModel && list.some(m => m.id === verifiedModel)) modelSelect.value = verifiedModel;
  keyStatus.textContent = models ? '\u2713 Verified! Select model and close.' : (currentProvider === 'custom' ? '\u26a0 Model list unavailable. Enter model name below.' : '\u26a0 Using default models. Select and close.');
  keyStatus.style.color = models ? '#4caf50' : '#ffa500';
  saveSettings();
  verifyBtn.disabled = false;
});

apiKeyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') verifyBtn.click(); });

settingsCloseBtn.addEventListener('click', () => {
  if (modelRow.style.display !== 'none') {
    verifiedModel = modelInput.style.display !== 'none' ? modelInput.value.trim() : modelSelect.value;
    saveSettings();
  }
  hideSettings();
});

function showAskInput() {
  askInputContainer.classList.remove('hidden');
  setTimeout(() => askInput.focus(), 50);
}

function hideAskInput() {
  askInputContainer.classList.add('hidden');
  askInput.value = '';
}

askSendBtn.addEventListener('click', () => {
  const text = askInput.value.trim();
  if (text) sendChatMessage(text);
});

askInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const text = askInput.value.trim(); if (text) sendChatMessage(text); }
});

askInputContainer.addEventListener('mousedown', (e) => e.stopPropagation());

function showMessage(msg, tts) {
  messageContent.textContent = msg;
  messageWindow.classList.add('show');
  if (tts) speakText(msg);
}

function hideMessage() {
  messageWindow.classList.remove('show');
}

messageWindow.addEventListener('mousedown', (e) => e.stopPropagation());
messageWindow.addEventListener('click', (e) => {
  e.stopPropagation();
  hideMessage();
});

async function sendChatMessage(text) {
  let baseURL = PROVIDERS[currentProvider].baseURL;
  if (currentProvider === 'custom') baseURL = customUrlInput.value.trim() || baseURL;

  const model = modelInput.style.display !== 'none' ? modelInput.value.trim() : (verifiedModel || modelSelect.value);
  if (!model) { showMessage('No model selected. Open Settings.'); return; }
  if (!savedKey) { showMessage('No API key configured. Open Settings.'); return; }
  if (!baseURL) { showMessage('No Base URL configured. Open Settings.'); return; }

  hideAskInput();
  showMessage('Thinking...');

  try {
    const response = await PROVIDERS[currentProvider].sendMessage(baseURL, savedKey, model, text);
    showMessage(response || '(empty response)', true);
  } catch (e) {
    showMessage('Error: ' + (e.message || 'Failed'));
  }
}

// --- Wander Mode (Auto Walk) ---
let wanderEnabled = false;
let wanderActive = false;
let wanderTarget = null;
let wanderSpeed = 2;
let wanderRaf = null;
let aiThinking = false;
let walkingPhase = 0;
let screenInfo = { width: 1920, height: 1080 };
let wanderPaused = false;
let wanderPos = null; // local position tracking
let posSyncCounter = 0;
let pickingTarget = false;
let restFrames = 0;

function getScreenInfo() {
  ipcRenderer.invoke('get-screen-info').then(info => {
    if (info) screenInfo = info;
  });
}

async function getCurrentPos() {
  try {
    return await ipcRenderer.invoke('get-window-position');
  } catch (e) {
    return null;
  }
}

function resetLegs() {
  ['leg-fl', 'leg-bl', 'leg-fr', 'leg-br'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('transform', '');
  });
}

function updateWalkLabel() {
  if (walkBtn) walkBtn.classList.toggle('active', wanderEnabled);
}

async function toggleWander() {
  wanderEnabled = !wanderEnabled;
  localStorage.setItem('pet_wander', wanderEnabled ? '1' : '0');
  updateWalkLabel();
  if (wanderEnabled) {
    if (currentState === PET_STATES.SLEEP) setState(PET_STATES.IDLE);
    await startWander();
  } else {
    stopWander();
  }
}

async function startWander() {
  wanderActive = true;
  wanderPaused = false;
  restFrames = 0;
  pickingTarget = false;
  getScreenInfo();
  const pos = await getCurrentPos();
  if (pos) wanderPos = { x: pos.x, y: pos.y };
  await pickNextTarget();
  if (wanderRaf) cancelAnimationFrame(wanderRaf);
  wanderLoop();
}

function stopWander() {
  wanderActive = false;
  wanderPaused = false;
  wanderTarget = null;
  wanderPos = null;
  aiThinking = false;
  pickingTarget = false;
  restFrames = 0;
  if (wanderRaf) cancelAnimationFrame(wanderRaf);
  wanderRaf = null;
  walkingPhase = 0;
  resetLegs();
  if (currentState === PET_STATES.WALKING) setState(PET_STATES.IDLE);
}

function pauseWander() {
  wanderPaused = true;
  resetLegs();
}

function resumeWander() {
  if (!wanderEnabled || !wanderActive) return;
  wanderPaused = false;
  if (!wanderRaf) wanderLoop();
}

function updateWalkAnimation(phase) {
  const s = Math.sin(phase);
  const lift1 = Math.max(0, s) * 5;
  const lift2 = Math.max(0, -s) * 5;

  const legFL = document.getElementById('leg-fl');
  const legBL = document.getElementById('leg-bl');
  const legFR = document.getElementById('leg-fr');
  const legBR = document.getElementById('leg-br');

  if (legFL) legFL.setAttribute('transform', `translate(0, ${-lift1})`);
  if (legBR) legBR.setAttribute('transform', `translate(0, ${-lift1})`);
  if (legBL) legBL.setAttribute('transform', `translate(0, ${-lift2})`);
  if (legFR) legFR.setAttribute('transform', `translate(0, ${-lift2})`);
}

function wanderLoop() {
  if (!wanderActive || wanderPaused || aiThinking) {
    if (currentState === PET_STATES.WALKING) setState(PET_STATES.IDLE);
    wanderRaf = requestAnimationFrame(wanderLoop);
    return;
  }

  if (currentState === PET_STATES.SLEEP) {
    wanderRaf = requestAnimationFrame(wanderLoop);
    return;
  }

  if (restFrames > 0) {
    if (currentState === PET_STATES.WALKING) setState(PET_STATES.IDLE);
    restFrames--;
    wanderRaf = requestAnimationFrame(wanderLoop);
    return;
  }

  if (!wanderTarget && !pickingTarget) {
    pickingTarget = true;
    pickNextTarget().then(() => { pickingTarget = false; }).catch(() => { pickingTarget = false; });
    wanderRaf = requestAnimationFrame(wanderLoop);
    return;
  }
  if (pickingTarget) {
    if (currentState === PET_STATES.WALKING) setState(PET_STATES.IDLE);
    wanderRaf = requestAnimationFrame(wanderLoop);
    return;
  }

  if (!settingsPanel.classList.contains('hidden') || !askInputContainer.classList.contains('hidden')) {
    wanderPaused = true;
    resetLegs();
    wanderRaf = requestAnimationFrame(wanderLoop);
    return;
  }

  if (!wanderPos) {
    getCurrentPos().then(pos => {
      if (pos) wanderPos = { x: pos.x, y: pos.y };
      wanderRaf = requestAnimationFrame(wanderLoop);
    });
    return;
  }

  const dx = wanderTarget.x - wanderPos.x;
  const dy = wanderTarget.y - wanderPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 8) {
    wanderTarget = null;
    restFrames = 3; // minimal gap between targets
    wanderRaf = requestAnimationFrame(wanderLoop);
    return;
  }

  const step = Math.min(wanderSpeed, dist);
  let stepX = (dx / dist) * step;
  let stepY = (dy / dist) * step;

  const absX = Math.abs(stepX), absY = Math.abs(stepY);
  if (dist >= 1) {
    if (absX < 0.5 && absY < 0.5) {
      if (absX >= absY) stepX = Math.sign(dx);
      else stepY = Math.sign(dy);
    } else {
      stepX = Math.round(stepX);
      stepY = Math.round(stepY);
      if (stepX === 0 && stepY === 0) {
        if (absX >= absY) stepX = Math.sign(dx);
        else stepY = Math.sign(dy);
      }
    }
  }

  const newX = wanderPos.x + stepX;
  const newY = wanderPos.y + stepY;
  ipcRenderer.invoke('set-window-pos', { x: Math.round(newX), y: Math.round(newY) }).catch(() => {});
  wanderPos.x = newX;
  wanderPos.y = newY;

  walkingPhase += 0.12;
  updateWalkAnimation(walkingPhase);
  if (currentState === PET_STATES.IDLE || currentState === PET_STATES.WALKING) {
    setState(PET_STATES.WALKING);
  }

  wanderRaf = requestAnimationFrame(wanderLoop);
}

function randomTarget() {
  const margin = 150;
  const x = margin + Math.random() * (screenInfo.width - margin * 2);
  const y = margin + Math.random() * (screenInfo.height - margin * 2 - 50);
  wanderTarget = { x: Math.round(x), y: Math.round(y) };
}

async function pickNextTarget() {
  if (!savedKey || !verifiedModel) {
    randomTarget();
    return;
  }

  aiThinking = true;
  if (!wanderPos) {
    const pos = await getCurrentPos();
    if (!pos) { aiThinking = false; randomTarget(); return; }
    wanderPos = { x: pos.x, y: pos.y };
  }

  thoughtBubble.classList.remove('hidden');
  thoughtText.textContent = 'Where to go...';

  try {
    let baseURL = PROVIDERS[currentProvider].baseURL;
    if (currentProvider === 'custom') baseURL = customUrlInput.value.trim() || baseURL;

    const prompt = `You are a cute desktop pet on a ${screenInfo.width}x${screenInfo.height} screen at position (${Math.round(wanderPos.x)}, ${Math.round(wanderPos.y)}). Choose a fun destination to walk to. Reply ONLY with two numbers: x y. Stay at least 120px from edges (X: 120-${screenInfo.width - 120}, Y: 120-${screenInfo.height - 120}). Be random and playful!`;

    const response = await PROVIDERS[currentProvider].sendMessage(baseURL, savedKey, verifiedModel, prompt);

    const nums = response.match(/-?\d+/g);
    if (nums && nums.length >= 2) {
      let tx = parseInt(nums[0]);
      let ty = parseInt(nums[1]);
      tx = Math.max(100, Math.min(screenInfo.width - 100, tx));
      ty = Math.max(100, Math.min(screenInfo.height - 75, ty));
      wanderTarget = { x: tx, y: ty };
    } else {
      randomTarget();
    }
  } catch (e) {
    randomTarget();
  }

  thoughtBubble.classList.add('hidden');
  aiThinking = false;
  if (wanderActive && !wanderPaused && currentState === PET_STATES.IDLE) {
    setState(PET_STATES.WALKING);
  }
}

// --- Init ---
container.addEventListener('mouseenter', () => {
  if (currentState === PET_STATES.SLEEP) return;
  resetIdleTimer();
  wakeUp();
});

setState(PET_STATES.IDLE);

// --- Blink every 15-20s ---
const eyeRects = [document.getElementById('eye-rect-left'), document.getElementById('eye-rect-right')];
const EYE_H = 20;
function blink() {
  eyeRects.forEach(el => { if (el) el.setAttribute('height', '2'); });
  setTimeout(() => eyeRects.forEach(el => { if (el) el.setAttribute('height', EYE_H); }), 100);
}
function scheduleBlink() {
  const delay = 15000 + Math.random() * 5000;
  setTimeout(() => { blink(); scheduleBlink(); }, delay);
}
scheduleBlink();

// --- Feed timer ---
const feedTimer = document.getElementById('feed-timer');
function updateFeedTimer() {
  if (!feedTimer) return;
  if (radialMenu.classList.contains('hidden')) { feedTimer.classList.add('hidden'); return; }
  const _fd = getXPData();
  if (!_fd.lastFeed) { feedTimer.classList.add('hidden'); return; }
  const elapsed = Date.now() - _fd.lastFeed;
  const remaining = FEED_COOLDOWN - elapsed;
  if (remaining <= 0) { feedTimer.classList.add('hidden'); return; }
  const _fm = Math.floor(remaining / 60000);
  const _fs = Math.ceil((remaining % 60000) / 1000);
  feedTimer.textContent = _fm > 0 ? `${_fm}м ${_fs}с` : `${_fs}с`;
  feedTimer.classList.remove('hidden');
}
setInterval(updateFeedTimer, 1000);

// ═══════════════════════════════════════════
// Launcher + XP + Auto-Think
// ═══════════════════════════════════════════

const launcherEl = document.getElementById('launcher');
const petModeEl = document.getElementById('pet-mode');
const previewPF = document.querySelectorAll('#preview-svg .pf');

// ── Tab Switching ──
document.querySelectorAll('.l-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.l-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tab = document.getElementById(btn.dataset.tab);
    if (tab) tab.classList.add('active');
  });
});

// ── Window Controls ──
document.getElementById('minimize-btn').addEventListener('click', () => ipcRenderer.send('minimize-window'));
document.getElementById('close-btn').addEventListener('click', () => ipcRenderer.send('close-window'));

// ── Enter / Exit Pet Mode ──
function enterPetMode() {
  launcherEl.style.display = 'none';
  petModeEl.style.display = 'flex';
  ipcRenderer.invoke('show-pet');
  if (autoThinkEnabled) startAutoThink();
}

function returnToLauncher() {
  if (launcherEl.style.display !== 'none') return;
  stopAutoThink();
  if (wanderEnabled) { wanderEnabled = false; stopWander(); updateWalkLabel(); }
  if (currentState === PET_STATES.SLEEP) setState(PET_STATES.IDLE);
  hideMenu(true);
  hideSettings();
  hideAskInput();
  hideMessage();
  launcherEl.style.display = '';
  petModeEl.style.display = 'none';
  ipcRenderer.invoke('show-launcher');
  updateStatCard();
}

document.getElementById('launch-btn').addEventListener('click', enterPetMode);

// ── Pet Settings ──

function addWheelSlider(input) {
  if (!input) return;
  input.addEventListener('wheel', (e) => {
    e.preventDefault();
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const step = parseFloat(input.step) || 1;
    const dir = e.deltaY < 0 ? 1 : -1;
    let v = parseFloat(input.value) + dir * step;
    v = Math.round(v / step) * step;
    v = Math.max(min, Math.min(max, v));
    input.value = v;
    const evt = new Event('input', { bubbles: true });
    input.dispatchEvent(evt);
  }, { passive: false });
}

function updateSliderFill(input) {
  if (!input) return;
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const v = parseFloat(input.value);
  const pct = ((v - min) / (max - min)) * 100;
  const fg = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#fbf1c7';
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--line-strong').trim() || '#383b3c';
  input.style.background = `linear-gradient(to right, ${fg} 0%, ${fg} ${pct}%, ${bg} ${pct}%, ${bg} 100%)`;
}

function loadPetSlider(id, valId, storageKey, apply) {
  const input = document.getElementById(id);
  const val = document.getElementById(valId);
  if (!input) return;
  const saved = localStorage.getItem(storageKey);
  if (saved) { input.value = saved; if (apply) apply(parseFloat(saved)); }
  const onInput = () => {
    const v = parseFloat(input.value);
    if (val) val.textContent = v % 1 === 0 ? v : v.toFixed(1);
    localStorage.setItem(storageKey, v);
    if (apply) apply(v);
    updateSliderFill(input);
  };
  input.addEventListener('input', onInput);
  addWheelSlider(input);
  updateSliderFill(input);
}

loadPetSlider('bs-input', 'bs-val', 'pet_breathe_speed', v => {
  document.documentElement.style.setProperty('--breathe-speed', (6.5 - v) + 's');
});
loadPetSlider('ba-input', 'ba-val', 'pet_breathe_amp', v => {
  document.documentElement.style.setProperty('--breathe-amp', v + 'px');
});
loadPetSlider('ws-input', 'ws-val', 'pet_walk_speed', v => {
  wanderSpeed = v;
});

// Pet color
const petColorSwatches = document.getElementById('pet-color-swatches');
if (petColorSwatches) {
  petColorSwatches.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      petColorSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      const color = sw.dataset.color;
      applyPetColor(color);
      previewPF.forEach(el => el.setAttribute('fill', color));
      localStorage.setItem('pet_color', color);
    });
  });
  const customColorInput = document.getElementById('custom-color-input');
  if (customColorInput) {
    customColorInput.addEventListener('input', () => {
      petColorSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      const color = customColorInput.value;
      applyPetColor(color);
      previewPF.forEach(el => el.setAttribute('fill', color));
      localStorage.setItem('pet_color', color);
    });
  }
}

function applyPetColor(color) {
  document.querySelectorAll('#pet-svg [fill="#df7959"]').forEach(el => {
    el.setAttribute('fill', color);
  });
}

try {
  const savedColor = localStorage.getItem('pet_color');
  if (savedColor) {
    applyPetColor(savedColor);
    previewPF.forEach(el => el.setAttribute('fill', savedColor));
    const activeSwatch = petColorSwatches?.querySelector(`.color-swatch[data-color="${savedColor}"]`);
    if (activeSwatch) {
      petColorSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      activeSwatch.classList.add('active');
    }
  }
} catch (e) {}

// Auto-think toggle
let autoThinkEnabled = false;
const autoThinkToggle = document.getElementById('auto-think-toggle');
if (autoThinkToggle) {
  try { autoThinkEnabled = localStorage.getItem('auto_think') === '1'; autoThinkToggle.classList.toggle('on', autoThinkEnabled); } catch (e) {}
  autoThinkToggle.addEventListener('click', () => {
    autoThinkEnabled = !autoThinkEnabled;
    autoThinkToggle.classList.toggle('on', autoThinkEnabled);
    localStorage.setItem('auto_think', autoThinkEnabled ? '1' : '0');
    if (autoThinkEnabled && petModeEl.style.display !== 'none') startAutoThink();
    else stopAutoThink();
  });
}

// Auto-walk toggle
const autoWalkToggle = document.getElementById('auto-walk-toggle');
if (autoWalkToggle) {
  autoWalkToggle.classList.toggle('on', wanderEnabled);
  autoWalkToggle.addEventListener('click', () => {
    toggleWander();
    autoWalkToggle.classList.toggle('on', wanderEnabled);
  });
}

// ── TTS ──
let ttsEnabled = false;
const ttsToggle = document.getElementById('tts-toggle');
if (ttsToggle) {
  try { ttsEnabled = localStorage.getItem('pet_tts') === '1'; ttsToggle.classList.toggle('on', ttsEnabled); } catch (e) {}
  ttsToggle.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    ttsToggle.classList.toggle('on', ttsEnabled);
    localStorage.setItem('pet_tts', ttsEnabled ? '1' : '0');
    if (!ttsEnabled) speechSynthesis.cancel();
  });
}

function speakText(text) {
  if (!ttsEnabled || !text || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  u.rate = 0.9;
  u.pitch = 1.0;
  u.volume = 1.0;

  function pickAndSpeak() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) { setTimeout(pickAndSpeak, 100); return; }
    const ru = voices.filter(v => v.lang.startsWith('ru'));
    const preferred = ru.find(v => /microsoft.*natural|google.*russian|premium|online/i.test(v.name))
      || ru.find(v => /microsoft|google|natural/i.test(v.name))
      || ru.find(v => /female|женс|svetlana|irina|elena|olga|maria|tatyana|dariya|alena|oksana/i.test(v.name))
      || ru[0]
      || voices.find(v => v.lang.startsWith('en') && /natural|premium/i.test(v.name));
    if (preferred) u.voice = preferred;
    speechSynthesis.speak(u);
  }

  if (speechSynthesis.getVoices().length) {
    pickAndSpeak();
  } else {
    speechSynthesis.addEventListener('voiceschanged', pickAndSpeak, { once: true });
    setTimeout(pickAndSpeak, 300);
  }
}

// Pet opacity
const petOpacity = document.getElementById('pet-opacity');
const petOpacityVal = document.getElementById('pet-opacity-val');
if (petOpacity) {
  const savedOp = localStorage.getItem('pet_opacity');
  if (savedOp) { petOpacity.value = savedOp; const v = parseFloat(savedOp); petModeEl.style.opacity = v; petOpacityVal.textContent = Math.round(v * 100) + '%'; }
  petOpacity.addEventListener('input', () => {
    const v = parseFloat(petOpacity.value);
    petOpacityVal.textContent = Math.round(v * 100) + '%';
    petModeEl.style.opacity = v;
    localStorage.setItem('pet_opacity', v);
    updateSliderFill(petOpacity);
  });
  addWheelSlider(petOpacity);
  updateSliderFill(petOpacity);
}

// ── Auto-Think System ──
const THINK_PHRASES = [
  'Интересно...', 'Что бы ещё съесть?', 'Мур-мур...',
  'Хочу гулять!', 'Скучно...', 'Где мой хозяин?',
  'Погладь меня!', 'Давай поиграем!', 'Я устал...',
  'Поспать бы...', 'Мяу?', 'Какой хороший день!',
];

let autoThinkInterval = null;

function startAutoThink() {
  stopAutoThink();
  const delay = 15000 + Math.random() * 15000;
  autoThinkInterval = setTimeout(function tick() {
    if (currentState !== PET_STATES.IDLE) {
      autoThinkInterval = setTimeout(tick, 5000);
      return;
    }
    const phrase = THINK_PHRASES[Math.floor(Math.random() * THINK_PHRASES.length)];
    thoughtBubble.classList.remove('hidden');
    thoughtText.textContent = phrase;
    setTimeout(() => {
      thoughtBubble.classList.add('hidden');
      if (autoThinkEnabled) {
        autoThinkInterval = setTimeout(tick, 15000 + Math.random() * 15000);
      }
    }, 4000);
  }, delay);
}

function stopAutoThink() {
  clearTimeout(autoThinkInterval);
  autoThinkInterval = null;
}

// ── Launcher AI Tab ──
const PROVIDER_ICONS = {
  openai: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a6 6 0 0 0-.516-4.91 6.05 6.05 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.99 5.99 0 0 0-4 2.9 6.05 6.05 0 0 0 .744 7.097 5.98 5.98 0 0 0 .51 4.911 6.05 6.05 0 0 0 6.515 2.9A6.07 6.07 0 0 0 13.26 24a6.06 6.06 0 0 0 5.772-4.206 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.747-7.073M13.26 22.43a4.48 4.48 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.8.8 0 0 0 .392-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494M3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.77.77 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646M2.34 7.896a4.5 4.5 0 0 1 2.366-1.973V11.6a.77.77 0 0 0 .388.677l5.815 3.354-2.02 1.168a.08.08 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.08.08 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667m2.01-3.023-.141-.085-4.774-2.782a.78.78 0 0 0-.785 0L9.409 9.23V6.897a.07.07 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.8.8 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"/></svg>',
  groq: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 0 1-3.033-1.252l-1.851 1.818A7 7 0 0 0 12.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z"/></svg>',
  openrouter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 0 0-.755-.498l-.467-.28a55.927 55.927 0 0 0-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z"/></svg>',
anthropic: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 6.603 1192.672 1193.397" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="m233.96 800.215 234.684-131.678 3.947-11.436-3.947-6.363h-11.436l-39.221-2.416-134.094-3.624-116.296-4.832-112.67-6.04-28.35-6.04-26.577-35.035 2.738-17.477 23.84-16.027 34.147 2.98 75.463 5.155 113.235 7.812 82.147 4.832 121.692 12.644h19.329l2.738-7.812-6.604-4.832-5.154-4.832-117.182-79.41-126.845-83.92-66.443-48.321-35.92-24.484-18.12-22.953-7.813-50.093 32.618-35.92 43.812 2.98 11.195 2.98 44.375 34.147 94.792 73.37 123.786 91.167 18.12 15.06 7.249-5.154.886-3.624-8.135-13.61-67.329-121.692-71.838-123.785-31.974-51.302-8.456-30.765c-2.98-12.645-5.154-23.275-5.154-36.242l37.127-50.416 20.537-6.604 49.53 6.604 20.86 18.121 30.765 70.39 49.852 110.818 77.315 150.684 22.631 44.698 12.08 41.396 4.51 12.645h7.813v-7.248l6.362-84.886 11.759-104.215 11.436-134.094 3.946-37.772 18.685-45.262 37.127-24.482 28.994 13.852 23.839 34.148-3.303 22.067-14.174 92.134-27.785 144.323-18.121 96.644h10.55l12.08-12.08 48.887-64.913 82.147-102.685 36.242-40.752 42.282-45.02 27.14-21.423h51.303l37.772 56.135-16.913 57.986-52.832 67.007-43.812 56.779-62.82 84.563-39.22 67.651 3.623 5.396 9.343-.886 141.906-30.201 76.671-13.852 91.49-15.705 41.396 19.329 4.51 19.65-16.269 40.189-97.852 24.16-114.764 22.954-170.9 40.43-2.093 1.53 2.416 2.98 76.993 7.248 32.94 1.771h80.617l150.12 11.195 39.222 25.933 23.517 31.732-3.946 24.16-60.403 30.766-81.503-19.33-190.228-45.26-65.235-16.27h-9.02v5.397l54.362 53.154 99.624 89.96 124.752 115.973 6.362 28.671-16.027 22.63-16.912-2.415-109.611-82.47-42.282-37.127-95.758-80.618h-6.363v8.456l22.067 32.296 116.537 175.167 6.04 53.719-8.456 17.476-30.201 10.55-33.181-6.04-68.215-95.758-70.39-107.84-56.778-96.644-6.926 3.947-33.503 360.886-15.705 18.443-36.243 13.852-30.201-22.953-16.027-37.127 16.027-73.37 19.329-95.758 15.704-76.107 14.175-94.55 8.456-31.41-.563-2.094-6.927.886-71.275 97.852-108.402 146.497-85.772 91.812-20.537 8.134-35.597-18.443 3.301-32.94 19.893-29.315 118.712-151.007 71.597-93.583 46.228-54.04-.322-7.813h-2.738l-315.302 204.725-56.135 7.248-24.16-22.63 2.98-37.128 11.435-12.08 94.792-65.236-.322.323z" fill="currentColor"/></svg>',
  gemini: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M23 12.245c0-.905-.075-1.565-.236-2.25h-10.54v4.083h6.186c-.124 1.014-.797 2.542-2.294 3.569l-.021.136 3.332 2.53.23.022C21.779 18.417 23 15.593 23 12.245z" fill="currentColor"></path><path d="M12.225 23c3.03 0 5.574-.978 7.433-2.665l-3.542-2.688c-.948.648-2.22 1.1-3.891 1.1a6.745 6.745 0 01-6.386-4.572l-.132.011-3.465 2.628-.045.124C4.043 20.531 7.835 23 12.225 23z" fill="currentColor"></path><path d="M5.84 14.175A6.65 6.65 0 015.463 12c0-.758.138-1.491.361-2.175l-.006-.147-3.508-2.67-.115.054A10.831 10.831 0 001 12c0 1.772.436 3.447 1.197 4.938l3.642-2.763z" fill="currentColor"></path><path d="M12.225 5.253c2.108 0 3.529.892 4.34 1.638l3.167-3.031C17.787 2.088 15.255 1 12.225 1 7.834 1 4.043 3.469 2.197 7.062l3.63 2.763a6.77 6.77 0 016.398-4.572z" fill="currentColor"></path></svg>',
  deepseek: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" fill="currentColor"/></svg>',
  mistral: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Mistral</title><path d="M3.428 3.4h3.429v3.428H3.428V3.4zm13.714 0h3.43v3.428h-3.43V3.4z" fill="currentColor"></path><path d="M3.428 6.828h6.857v3.429H3.429V6.828zm10.286 0h6.857v3.429h-6.857V6.828z" fill="currentColor"></path><path d="M3.428 10.258h17.144v3.428H3.428v-3.428z" fill="currentColor"></path><path d="M3.428 13.686h3.429v3.428H3.428v-3.428zm6.858 0h3.429v3.428h-3.429v-3.428zm6.856 0h3.43v3.428h-3.43v-3.428z" fill="currentColor"></path><path d="M0 17.114h10.286v3.429H0v-3.429zm13.714 0H24v3.429H13.714v-3.429z" fill="currentColor"></path></svg>',
  together: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.197 4.503A6 6 0 0 0 15 2.307a5.973 5.973 0 0 0-2.995 4.933l5.996.008v.515h-5.996c.039.937.298 1.87.8 2.74a6 6 0 1 0 10.39-6zM.805 4.5A6 6 0 0 0 3 12.697a5.972 5.972 0 0 0 5.77.127L5.779 7.627l.446-.257 2.997 5.192A6 6 0 1 0 .804 4.5zM12 23.894a6 6 0 0 0 5.999-6c0-2.13-1.1-3.996-2.775-5.06l-3.005 5.189-.444-.258 2.997-5.192A6 6 0 1 0 12 23.894z"/></svg>',
  perplexity: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.785 0v7.272H22.5V17.62h-2.935V24l-7.037-6.194v6.145h-1.091v-6.152L4.392 24v-6.465H1.5V7.188h2.884V0l7.053 6.494V.19h1.09v6.49L19.786 0zm-7.257 9.044v7.319l5.946 5.234V14.44l-5.946-5.397zm-1.099-.08l-5.946 5.398v7.235l5.946-5.234V8.965zm8.136 7.58h1.844V8.349H13.46l6.105 5.54v2.655zm-8.982-8.28H2.59v8.195h1.8v-2.576l6.192-5.62zM5.475 2.476v4.71h5.115l-5.115-4.71zm13.219 0l-5.115 4.71h5.115v-4.71z"/></svg>',
  xai: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.469 8.776L16.512 23h-4.464L2.005 8.776H6.47zm-.004 7.9l2.233 3.164L6.467 23H2l4.465-6.324zM22 2.582V23h-3.659V7.764L22 2.582zM22 1l-9.952 14.095-2.233-3.163L17.533 1H22z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
  custom: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
};

const LAUNCHER_PROVIDERS = [
  { value: 'openai', label: 'OpenAI', icon: 'openai' },
  { value: 'groq', label: 'Groq', icon: 'groq' },
  { value: 'openrouter', label: 'OpenRouter', icon: 'openrouter' },
  { value: 'anthropic', label: 'Claude', icon: 'anthropic' },
  { value: 'gemini', label: 'Gemini', icon: 'gemini' },
  { value: 'deepseek', label: 'DeepSeek', icon: 'deepseek' },
  { value: 'mistral', label: 'Mistral', icon: 'mistral' },
  { value: 'together', label: 'Together AI', icon: 'together' },
  { value: 'perplexity', label: 'Perplexity', icon: 'perplexity' },
  { value: 'xai', label: 'xAI (Grok)', icon: 'xai' },
  { value: 'github', label: 'GitHub Models', icon: 'github' },
  { value: 'custom', label: 'Custom', icon: 'custom' },
];

// Provider custom select
const launcherCsLabel = document.getElementById('launcher-cs-label');
const launcherCsDropdown = document.getElementById('launcher-cs-dropdown');
const launcherProviderSelect = document.getElementById('launcher-provider');

if (launcherCsLabel && launcherCsDropdown && launcherProviderSelect) {
  let prevProvider = 'openai';

  function getProviderSvg(provider) {
    return PROVIDER_ICONS[provider.icon] || '';
  }

  function updateTriggerIcon(provider) {
    const iconEl = document.getElementById('launcher-cs-icon');
    if (iconEl) iconEl.innerHTML = getProviderSvg(provider);
  }

  function renderProviderDropdown() {
    launcherCsDropdown.innerHTML = '';
    LAUNCHER_PROVIDERS.forEach(p => {
      const item = document.createElement('div');
      item.className = 'cs-item';
      item.dataset.value = p.value;
      item.innerHTML = `<span class="cs-item-icon">${getProviderSvg(p)}</span><span class="cs-item-label">${p.label}</span>`;
      if (p.value === prevProvider) item.classList.add('active');
      item.addEventListener('click', () => {
        prevProvider = p.value;
        launcherCsLabel.textContent = p.label;
        launcherProviderSelect.value = p.value;
        updateTriggerIcon(p);
        launcherCsDropdown.classList.add('hidden');
        launcherCsDropdown.querySelectorAll('.cs-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        // Show/hide custom URL row directly
        const urlRow = document.getElementById('launcher-custom-url-row');
        if (urlRow) urlRow.style.display = p.value === 'custom' ? 'flex' : 'none';
        // Also toggle pet mode custom URL row
        if (customUrlRow) customUrlRow.style.display = p.value === 'custom' ? 'flex' : 'none';
        // Hide model row until verified
        const modelRow = document.getElementById('launcher-model-row');
        if (modelRow) modelRow.style.display = 'none';
        // Update provider select in pet mode
        if (providerSelect) providerSelect.value = p.value;
        currentProvider = p.value;
        saveLauncherAiSettings();
      });
      launcherCsDropdown.appendChild(item);
    });
  }

  renderProviderDropdown();
  // Set initial icon
  const initial = LAUNCHER_PROVIDERS.find(p => p.value === prevProvider);
  if (initial) updateTriggerIcon(initial);

  document.getElementById('launcher-cs-trigger').addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = launcherCsDropdown.classList.contains('hidden');
    document.querySelectorAll('.cs-dropdown').forEach(d => d.classList.add('hidden'));
    if (isHidden) launcherCsDropdown.classList.remove('hidden');
  });

  const launcherModelCsTrigger = document.getElementById('launcher-model-cs-trigger');
  const launcherModelCsDropdown = document.getElementById('launcher-model-cs-dropdown');
  if (launcherModelCsTrigger && launcherModelCsDropdown) {
    launcherModelCsTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = launcherModelCsDropdown.classList.contains('hidden');
      document.querySelectorAll('.cs-dropdown').forEach(d => d.classList.add('hidden'));
      if (isHidden) {
        launcherModelCsDropdown.classList.remove('hidden');
        const search = launcherModelCsDropdown.querySelector('.cs-dropdown-search');
        if (search) setTimeout(() => search.focus(), 50);
      }
    });
  }
}

document.addEventListener('click', () => {
  document.querySelectorAll('.cs-dropdown').forEach(d => d.classList.add('hidden'));
});

if (launcherProviderSelect) {
  launcherProviderSelect.addEventListener('change', () => {
    const val = launcherProviderSelect.value;
    const customUrlRow = document.getElementById('launcher-custom-url-row');
    if (customUrlRow) customUrlRow.style.display = val === 'custom' ? 'flex' : 'none';
    const modelRow = document.getElementById('launcher-model-row');
    if (modelRow) modelRow.style.display = 'none';
    const keyStatus = document.getElementById('launcher-key-status');
    if (keyStatus) keyStatus.textContent = '';
    const statusRow = document.getElementById('ai-status-row');
    if (statusRow) statusRow.style.display = 'none';
    if (providerSelect) providerSelect.value = val;
    currentProvider = val;
    saveLauncherAiSettings();
  });
}

// Toggle API key visibility
const launcherToggleKey = document.getElementById('launcher-toggle-key');
const launcherApiKey = document.getElementById('launcher-api-key');
const EYE_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5z"/><circle cx="8" cy="8" r="2"/></svg>';
const EYE_OFF_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5z"/><circle cx="8" cy="8" r="2"/><path d="M2 2l12 12"/></svg>';
if (launcherToggleKey && launcherApiKey) {
  launcherToggleKey.addEventListener('click', () => {
    const isHidden = launcherApiKey.type === 'password';
    launcherApiKey.type = isHidden ? 'text' : 'password';
    launcherToggleKey.innerHTML = isHidden ? EYE_OFF_ICON : EYE_ICON;
  });
}

// Verify key
const launcherVerifyBtn = document.getElementById('launcher-verify-btn');
const launcherKeyStatus = document.getElementById('launcher-key-status');
if (launcherVerifyBtn) {
  launcherVerifyBtn.addEventListener('click', async () => {
    const key = launcherApiKey ? launcherApiKey.value.trim() : '';
    if (!key) { launcherKeyStatus.textContent = 'Введите API ключ'; launcherKeyStatus.style.color = '#E74856'; return; }

    let baseURL = PROVIDERS[currentProvider]?.baseURL || '';
    if (currentProvider === 'custom') {
      const customUrl = document.getElementById('launcher-custom-url');
      baseURL = customUrl ? customUrl.value.trim() : '';
      if (!baseURL) { launcherKeyStatus.textContent = 'Введите Base URL'; launcherKeyStatus.style.color = '#E74856'; return; }
    }

    launcherVerifyBtn.disabled = true;
    launcherKeyStatus.textContent = 'Проверка...';
    launcherKeyStatus.style.color = '#888';
    savedKey = key;

    const modelSelectEl = document.getElementById('launcher-model-native');
    const modelDropdown = document.getElementById('launcher-model-cs-dropdown');
    const modelInput = document.getElementById('launcher-model-input');
    const modelRow = document.getElementById('launcher-model-row');

    if (modelSelectEl) modelSelectEl.innerHTML = '';
    if (modelInput) modelInput.style.display = 'none';

    let models = null;
    try {
      const prov = PROVIDERS[currentProvider];
      if (prov) models = await prov.listModels(baseURL, key);
      if (modelInput) modelInput.style.display = 'none';
    } catch (e) {
      console.warn('List models failed:', e.message);
      if (currentProvider === 'custom' && modelInput) modelInput.style.display = 'block';
    }

    const list = (models && models.length > 0) ? models : [];

    if (modelDropdown) {
      renderModelDropdown(list, modelDropdown, modelSelectEl, verifiedModel);
    }

    if (modelRow) modelRow.style.display = 'flex';
    if (currentProvider === 'custom' && !models && modelInput) modelInput.style.display = 'block';

    if (verifiedModel && list.some(m => m.id === verifiedModel) && modelSelectEl) {
      modelSelectEl.value = verifiedModel;
    }

    if (apiKeyInput) apiKeyInput.value = key;
    if (providerSelect) providerSelect.value = currentProvider;

    launcherKeyStatus.textContent = models ? '✓ Подтверждён' : (currentProvider === 'custom' ? '⚠ Введите модель вручную' : '⚠ Стандартные модели');
    launcherKeyStatus.style.color = models ? '#10893E' : '#FF8C00';

    const statusRow = document.getElementById('ai-status-row');
    const statusDot = document.getElementById('ai-status-dot');
    const statusText = document.getElementById('ai-status-text');
    if (statusRow && statusDot && statusText) {
      statusRow.style.display = 'flex';
      statusDot.style.background = models ? '#10893E' : '#FF8C00';
      statusText.textContent = models ? 'AI настроен' : '⚠ Нужна модель';
    }

    saveLauncherAiSettings();
    saveSettings();
    launcherVerifyBtn.disabled = false;
  });
}

function renderModelDropdown(list, container, nativeSelect, selectedValue) {
  container.innerHTML = '';
  if (nativeSelect) nativeSelect.innerHTML = '';

  const search = document.createElement('input');
  search.type = 'text';
  search.className = 'cs-dropdown-search';
  search.placeholder = 'Поиск модели...';
  container.appendChild(search);

  const items = list.map(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name || m.id;
    if (nativeSelect) nativeSelect.appendChild(opt);

    const item = document.createElement('div');
    item.className = 'cs-item';
    item.dataset.value = m.id;
    item.textContent = m.name || m.id;
    if (selectedValue && m.id === selectedValue) item.classList.add('active');
    item.addEventListener('click', () => {
      const label = document.getElementById('launcher-model-cs-label');
      if (label) label.textContent = m.name || m.id;
      if (nativeSelect) nativeSelect.value = m.id;
      container.classList.add('hidden');
      container.querySelectorAll('.cs-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      verifiedModel = m.id;
      const statusRow = document.getElementById('ai-status-row');
      const statusDot = document.getElementById('ai-status-dot');
      const statusText = document.getElementById('ai-status-text');
      if (statusRow && statusDot && statusText) {
        statusRow.style.display = 'flex';
        statusDot.style.background = '#10893E';
        statusText.textContent = 'AI настроен';
      }
      saveLauncherAiSettings();
    });
    container.appendChild(item);
    return item;
  });

  if (selectedValue) {
    const match = list.find(m => m.id === selectedValue);
    if (match) {
      const label = document.getElementById('launcher-model-cs-label');
      if (label) label.textContent = match.name || match.id;
    }
  }

  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    items.forEach(item => {
      item.style.display = (!q || item.textContent.toLowerCase().includes(q)) ? '' : 'none';
    });
  });

  setTimeout(() => search.focus(), 50);
}

function saveLauncherAiSettings() {
  const customUrl = document.getElementById('launcher-custom-url');
  const modelInputVal = document.getElementById('launcher-model-input');
  const modelSelectVal = document.getElementById('launcher-model-native');
  const modelLabel = document.getElementById('launcher-model-cs-label');

  let model = '';
  if (modelInputVal && modelInputVal.style.display !== 'none') model = modelInputVal.value.trim();
  else if (modelSelectVal) model = modelSelectVal.value;
  if (!model && modelLabel && modelLabel.textContent !== 'Выберите модель') model = modelLabel.textContent;

  if (model) verifiedModel = model;

  const data = {
    provider: currentProvider,
    key: savedKey,
    model: model || verifiedModel,
    customUrl: customUrl ? customUrl.value.trim() : '',
  };
  try { localStorage.setItem('pet_ai_settings', JSON.stringify(data)); } catch (e) {}
}

try {
  const saved = localStorage.getItem('pet_ai_settings');
  if (saved) {
    const s = JSON.parse(saved);
    if (s.provider) {
      currentProvider = s.provider;
      if (launcherProviderSelect) launcherProviderSelect.value = s.provider;
      const prov = LAUNCHER_PROVIDERS.find(p => p.value === s.provider);
      if (prov && launcherCsLabel) {
        launcherCsLabel.textContent = prov.label;
        const iconEl = document.getElementById('launcher-cs-icon');
        if (iconEl && PROVIDER_ICONS[prov.icon]) iconEl.innerHTML = PROVIDER_ICONS[prov.icon];
      }
      if (s.provider === 'custom') {
        const row = document.getElementById('launcher-custom-url-row');
        if (row) row.style.display = 'flex';
      }
    }
    if (s.key && launcherApiKey) launcherApiKey.value = s.key;
    if (s.customUrl) {
      const input = document.getElementById('launcher-custom-url');
      if (input) input.value = s.customUrl;
    }
    if (s.model) {
      verifiedModel = s.model;
      const label = document.getElementById('launcher-model-cs-label');
      if (label) label.textContent = s.model;
      const modelRow = document.getElementById('launcher-model-row');
      if (modelRow) modelRow.style.display = 'flex';
      const statusRow = document.getElementById('ai-status-row');
      if (statusRow) statusRow.style.display = 'flex';
      const statusDot = document.getElementById('ai-status-dot');
      const statusText = document.getElementById('ai-status-text');
      if (statusDot) statusDot.style.background = '#10893E';
      if (statusText) statusText.textContent = 'AI настроен';
      // Populate model dropdown with default models
      const nativeSelect = document.getElementById('launcher-model-native');
      const modelDropdown = document.getElementById('launcher-model-cs-dropdown');
      if (nativeSelect && modelDropdown) {
        const models = s.model ? [{ id: s.model, name: s.model }] : [];
        renderModelDropdown(models, modelDropdown, nativeSelect, s.model);
      }
    }
  }
} catch (e) {}

// ── Settings Tab ──

function setupToggle(id, storageKey, onChange) {
  const el = document.getElementById(id);
  if (!el) return;
  const saved = localStorage.getItem(storageKey);
  const isOn = saved === '1';
  el.classList.toggle('on', isOn);
  el.addEventListener('click', () => {
    const nowOn = el.classList.toggle('on');
    localStorage.setItem(storageKey, nowOn ? '1' : '0');
    if (onChange) onChange(nowOn);
  });
}

setupToggle('auto-launch-toggle', 'auto_launch');
setupToggle('always-on-top-toggle', 'always_on_top', (on) => ipcRenderer.send('set-always-on-top', on));
setupToggle('particles-toggle', 'particles_enabled');
setupToggle('float-letters-toggle', 'float_letters');

// Font size
const fontSizeInput = document.getElementById('font-size-input');
const fontSizeVal = document.getElementById('font-size-val');
function applyFontSize(v) {
  document.documentElement.style.setProperty('--font-size', v + 'px');
}
if (fontSizeInput) {
  const savedFs = localStorage.getItem('font_size');
  if (savedFs) { fontSizeInput.value = savedFs; applyFontSize(parseInt(savedFs)); fontSizeVal.textContent = savedFs + 'px'; }
  fontSizeInput.addEventListener('input', () => {
    const v = parseInt(fontSizeInput.value);
    fontSizeVal.textContent = v + 'px';
    applyFontSize(v);
    localStorage.setItem('font_size', v);
    updateSliderFill(fontSizeInput);
  });
  addWheelSlider(fontSizeInput);
  updateSliderFill(fontSizeInput);
}

// Accent color
const accentSwatches = document.getElementById('accent-swatches');
if (accentSwatches) {
  accentSwatches.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      accentSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      applyAccentColor(sw.dataset.color);
      localStorage.setItem('accent_color', sw.dataset.color);
    });
  });
  const accentColorInput = document.getElementById('accent-color-input');
  if (accentColorInput) {
    accentColorInput.addEventListener('input', () => {
      accentSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      applyAccentColor(accentColorInput.value);
      localStorage.setItem('accent_color', accentColorInput.value);
    });
  }
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  document.querySelectorAll('.btn, #launcher-verify-btn').forEach(el => el.classList.toggle('accent', !!color));
  document.querySelectorAll('.toggle-switch.on').forEach(el => el.classList.toggle('accent', !!color));
}

try {
  const savedAccent = localStorage.getItem('accent_color') || '#fe8019';
  applyAccentColor(savedAccent);
  const activeAccent = accentSwatches?.querySelector(`.color-swatch[data-color="${savedAccent}"]`);
  if (activeAccent) {
    accentSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    activeAccent.classList.add('active');
  }
  if (document.getElementById('accent-color-input')) document.getElementById('accent-color-input').value = savedAccent;
} catch (e) {}

// ── Proxy Configuration ──
const proxyToggle = document.getElementById('proxy-toggle');
const proxyDetails = document.getElementById('proxy-details');
const proxyProtocol = document.getElementById('proxy-protocol');
const proxyProtocolSelect = document.getElementById('proxy-protocol-select');
const proxyProtocolTrigger = document.getElementById('proxy-protocol-trigger');
const proxyProtocolLabel = document.getElementById('proxy-protocol-label');
const proxyProtocolDropdown = document.getElementById('proxy-protocol-dropdown');
const proxyHost = document.getElementById('proxy-host');
const proxyPort = document.getElementById('proxy-port');
const proxyUser = document.getElementById('proxy-user');
const proxyPass = document.getElementById('proxy-pass');
const proxyTestBtn = document.getElementById('proxy-test-btn');
const proxyStatus = document.getElementById('proxy-status');

// Custom proxy protocol dropdown
const PROXY_PROTOCOLS = [
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
  { value: 'socks5', label: 'SOCKS5' },
];

function renderProxyProtocolDropdown(selected) {
  if (!proxyProtocolDropdown) return;
  proxyProtocolDropdown.innerHTML = '';
  PROXY_PROTOCOLS.forEach(p => {
    const item = document.createElement('div');
    item.className = 'cs-item';
    item.dataset.value = p.value;
    item.textContent = p.label;
    if (p.value === selected) item.classList.add('active');
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      proxyProtocol.value = p.value;
      if (proxyProtocolLabel) proxyProtocolLabel.textContent = p.label;
      proxyProtocolDropdown.classList.add('hidden');
      proxyProtocolDropdown.querySelectorAll('.cs-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      saveProxyConfig();
    });
    proxyProtocolDropdown.appendChild(item);
  });
}

if (proxyProtocolTrigger && proxyProtocolDropdown) {
  renderProxyProtocolDropdown(proxyProtocol.value || 'http');
  proxyProtocolTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = proxyProtocolDropdown.classList.contains('hidden');
    document.querySelectorAll('.cs-dropdown').forEach(d => d.classList.add('hidden'));
    if (isHidden) proxyProtocolDropdown.classList.remove('hidden');
  });
}

function getProxyConfig() {
  return {
    enabled: proxyToggle?.classList.contains('on') || false,
    protocol: proxyProtocol?.value || 'http',
    host: proxyHost?.value.trim() || '',
    port: proxyPort?.value.trim() || '',
    username: proxyUser?.value.trim() || '',
    password: proxyPass?.value.trim() || '',
  };
}

function saveProxyConfig() {
  const cfg = getProxyConfig();
  try { localStorage.setItem('pet_proxy', JSON.stringify(cfg)); } catch (e) {}
  ipcRenderer.send('proxy-config', cfg);
}

function loadProxyConfig() {
  try {
    const raw = localStorage.getItem('pet_proxy');
    if (raw) {
      const cfg = JSON.parse(raw);
      if (proxyToggle) proxyToggle.classList.toggle('on', cfg.enabled);
      if (proxyDetails) proxyDetails.style.display = cfg.enabled ? 'flex' : 'none';
      if (proxyProtocol) proxyProtocol.value = cfg.protocol || 'http';
      const protoLabel = PROXY_PROTOCOLS.find(p => p.value === (cfg.protocol || 'http'));
      if (proxyProtocolLabel) proxyProtocolLabel.textContent = protoLabel ? protoLabel.label : 'HTTP';
      if (proxyProtocolDropdown) renderProxyProtocolDropdown(cfg.protocol || 'http');
      if (proxyHost) proxyHost.value = cfg.host || '';
      if (proxyPort) proxyPort.value = cfg.port || '';
      if (proxyUser) proxyUser.value = cfg.username || '';
      if (proxyPass) proxyPass.value = cfg.password || '';
      ipcRenderer.send('proxy-config', cfg);
    }
  } catch (e) {}
}

if (proxyToggle && proxyDetails) {
  proxyToggle.addEventListener('click', () => {
    const on = proxyToggle.classList.toggle('on');
    proxyDetails.style.display = on ? 'flex' : 'none';
    saveProxyConfig();
  });

  [proxyProtocol, proxyHost, proxyPort, proxyUser, proxyPass].forEach(el => {
    if (el) el.addEventListener('change', saveProxyConfig);
  });
}

if (proxyTestBtn && proxyStatus) {
  proxyTestBtn.addEventListener('click', async () => {
    const cfg = getProxyConfig();
    if (!cfg.host || !cfg.port) {
      proxyStatus.textContent = 'Укажите хост и порт';
      proxyStatus.style.color = '#E74856';
      return;
    }
    proxyStatus.textContent = 'Тестирование...';
    proxyStatus.style.color = '#888';
    try {
      const result = await ipcRenderer.invoke('test-proxy', cfg);
      if (result.ok) {
        proxyStatus.textContent = `✓ ${result.ms}ms`;
        proxyStatus.style.color = '#10893E';
      } else {
        proxyStatus.textContent = `✗ ${result.error}`;
        proxyStatus.style.color = '#E74856';
      }
    } catch (e) {
      proxyStatus.textContent = '✗ Ошибка подключения';
      proxyStatus.style.color = '#E74856';
    }
  });
}

loadProxyConfig();

// Reset
const resetBtn = document.getElementById('reset-settings-btn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });
}

// Auto-launch / Apply saved settings on startup
if (localStorage.getItem('auto_launch') === '1') {
  setTimeout(() => enterPetMode(), 100);
}
if (localStorage.getItem('always_on_top') === '1') {
  ipcRenderer.send('set-always-on-top', true);
}
// ── XP / Level System ──
const FEED_COOLDOWN = 900000;
const XP_PER_COOKIE = 10;

function getXPData() {
  try {
    const raw = localStorage.getItem('pet_xp');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { xp: 0, level: 1, cookies: 0, lastFeed: null };
}

function saveXPData(data) {
  try { localStorage.setItem('pet_xp', JSON.stringify(data)); } catch (e) {}
}

function xpForLevel(level) {
  return 15 * level * (level + 1);
}

function addXP(amount) {
  const data = getXPData();
  data.xp += amount;
  data.cookies++;

  let newLevel = data.level;
  while (data.xp >= xpForLevel(newLevel)) {
    newLevel++;
  }
  if (newLevel > data.level) {
    data.level = newLevel;
    spawnParticles(['▲', '★', '♦'], 8, '#fe8019', { spread: 60, riseDistance: 140, sizeRange: [18, 26] });
  }

  saveXPData(data);
  updateStatCard();
}

function updateXpBar(animate) {
  const data = getXPData();
  const xpBarContainer = document.getElementById('xp-bar-container');
  const xpBarFill = document.getElementById('xp-bar-fill');
  const xpBarText = document.getElementById('xp-bar-text');
  if (!xpBarContainer || !xpBarFill || !xpBarText) return;

  const prevXp = data.level > 1 ? xpForLevel(data.level - 1) : 0;
  const nextXp = xpForLevel(data.level);
  const progress = Math.min(1, (data.xp - prevXp) / (nextXp - prevXp));
  const pct = (progress * 100) + '%';

  xpBarText.textContent = 'Ур. ' + data.level;

  if (animate) {
    xpBarFill.style.width = '0%';
    xpBarContainer.classList.remove('hidden');
    requestAnimationFrame(() => {
      xpBarContainer.classList.add('show');
      xpBarFill.style.width = pct;
    });
    clearTimeout(xpBarContainer._hideTimer);
    xpBarContainer._hideTimer = setTimeout(() => {
      xpBarContainer.classList.remove('show');
      setTimeout(() => xpBarContainer.classList.add('hidden'), 400);
    }, 3500);
  }
}

function updateStatCard() {
  const data = getXPData();
  const levelEl = document.getElementById('stat-level');
  const xpEl = document.getElementById('stat-xp');
  const cookiesEl = document.getElementById('stat-cookies');
  const cooldownEl = document.getElementById('stat-cooldown');

  if (levelEl) levelEl.textContent = data.level;
  if (xpEl) {
    const prevXp = data.level > 1 ? xpForLevel(data.level - 1) : 0;
    const nextXp = xpForLevel(data.level);
    xpEl.textContent = (data.xp - prevXp) + ' / ' + (nextXp - prevXp);
  }
  if (cookiesEl) cookiesEl.textContent = data.cookies;
  if (cooldownEl) {
    if (data.lastFeed) {
      const elapsed = Date.now() - data.lastFeed;
      const remaining = FEED_COOLDOWN - elapsed;
      cooldownEl.textContent = remaining > 0 ? Math.ceil(remaining / 60000) + ' мин' : 'Готов!';
    } else {
      cooldownEl.textContent = 'Готов!';
    }
  }
}

function canFeed() {
  const data = getXPData();
  if (!data.lastFeed) return true;
  return Date.now() - data.lastFeed >= FEED_COOLDOWN;
}

updateStatCard();

// Init wander from saved state
try {
  const wanderSaved = localStorage.getItem('pet_wander');
  if (wanderSaved === '1' && !wanderEnabled) {
    wanderEnabled = true;
    updateWalkLabel();
    setTimeout(() => { if (wanderEnabled) startWander(); }, 500);
  }
} catch (e) {}
updateWalkLabel();

// ── Launcher Search ──
const lSearchInput = document.getElementById('l-search-input');
if (lSearchInput) {
  lSearchInput.addEventListener('input', () => {
    const q = lSearchInput.value.trim().toLowerCase();
    const tabs = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.l-tab');

    if (!q) {
      tabs.forEach(tab => { tab.style.display = ''; });
      tabButtons.forEach((btn, i) => {
        btn.classList.toggle('active', i === 0);
      });
      tabs.forEach(tab => tab.classList.remove('active'));
      document.getElementById('tab-launch')?.classList.add('active');
      // Reset all inner elements
      document.querySelectorAll('.card, .setting-row, .stat-card, .btn, h2').forEach(el => {
        el.style.display = '';
      });
      return;
    }

    tabs.forEach(tab => {
      const allItems = tab.querySelectorAll('.card, .setting-row, .stat-card, .btn');
      const h2 = tab.querySelector('h2');

      const tabText = tab.textContent.toLowerCase();
      const tabMatch = tabText.includes(q);

      let anyVisible = false;
      allItems.forEach(el => {
        const match = el.textContent.toLowerCase().includes(q);
        el.style.display = match ? '' : 'none';
        if (match) anyVisible = true;
      });

      if (h2) h2.style.display = tabMatch || anyVisible ? '' : 'none';
      tab.style.display = tabMatch || anyVisible ? '' : 'none';

      tab.classList.toggle('active', tabMatch || anyVisible);
      tabButtons.forEach(btn => {
        if (btn.dataset.tab === tab.id) {
          btn.classList.toggle('active', !!(tabMatch || anyVisible));
        }
      });
    });
  });
}

// ── Splash screen dismiss ──
(function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const start = Date.now();
  const minShow = 5000 + Math.random() * 4000;
  const ready = () => {
    const elapsed = Date.now() - start;
    const delay = Math.max(0, minShow - elapsed);
    setTimeout(() => {
      splash.classList.add('fade-out');
      setTimeout(() => { if (splash.parentNode) splash.remove(); }, 700);
    }, delay);
  };
  if (document.readyState === 'complete') ready();
  else window.addEventListener('load', ready);
})();
