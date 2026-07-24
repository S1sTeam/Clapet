import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

export type PetState = "idle" | "thinking" | "happy" | "sleep" | "walking" | "annoyed" | "dancing" | "nihma";

const PROVIDER_ICONS: Record<string, string> = {
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
  { value: "openai", label: "OpenAI", icon: "openai" },
  { value: "groq", label: "Groq", icon: "groq" },
  { value: "openrouter", label: "OpenRouter", icon: "openrouter" },
  { value: "anthropic", label: "Claude", icon: "anthropic" },
  { value: "gemini", label: "Gemini", icon: "gemini" },
  { value: "deepseek", label: "DeepSeek", icon: "deepseek" },
  { value: "mistral", label: "Mistral", icon: "mistral" },
  { value: "together", label: "Together AI", icon: "together" },
  { value: "perplexity", label: "Perplexity", icon: "perplexity" },
  { value: "xai", label: "xAI (Grok)", icon: "xai" },
  { value: "github", label: "GitHub Models", icon: "github" },
  { value: "custom", label: "Custom", icon: "custom" },
];

// const THINK_PHRASES = [
//   "Hmm...",
//   "I wonder...",
//   "What if...",
//   "Thinking...",
//   "Interesting...",
//   "Analyzing...",
//   "Processing...",
const EYE_BASES = {
  left: { x: 73, y: 132 },
  right: { x: 119, y: 132 },
};

const TRANSLATIONS = {
  en: {
    launchPet: "Launch Pet",
    settings: "Settings",
    petTab: "Pet",
    general: "General",
    ai: "AI",
    stats: "Stats",
    about: "About",
    language: "Interface Language",
    petOpacity: "Pet Opacity",
    breatheSpeed: "Breathe Speed",
    breatheAmp: "Breathe Amplitude",
    walkSpeed: "Walk Speed",
    fontSize: "Font Size",
    petColor: "Pet Color",
    accentColor: "Accent Color",
    alwaysOnTop: "Always on Top",
    proxy: "Proxy",
    search: "Search",
    yummy: "Yummy! 🍪",
    autoThink: "Automatic Thoughts",
    autoWalk: "Auto Wander",
    ttsEnabled: "Browser Voice Speech (TTS)",
    elevenLabsTts: "ElevenLabs Neural Voice (TTS)",
    elevenLabsKey: "ElevenLabs API Key",
    elevenLabsVoice: "ElevenLabs Voice ID",
    enterKeyMsg: "Please enter ElevenLabs API Key in AI settings!",
    particles: "Particle Effects",
    letters: "Typing Letters Effect",
    audioDance: "React & Dance to PC Audio/Music",
    systemPromptLabel: "Custom System Instruction (System Prompt)",
    systemPromptPlaceholder: "e.g. You are Clapet, a cute, obedient desktop pet. Obey your owner...",
    autoLaunch: "Launch on Windows Startup",
    provider: "Provider",
    verifyAndSave: "Verify & Fetch Models",
    apiKey: "API Key",
    enterApiKey: "Please enter an API Key!",
    customUrl: "Custom Base URL",
    selectModel: "Select Model",
    searchModel: "Search model...",
    apiConnected: "API Connected Successfully",
    apiError: "API Connection Error",
    level: "Level",
    xp: "XP",
    cookiesEaten: "Cookies Eaten",
    nextFeed: "Next Feeding",
    resetSettings: "Reset All Settings",
    sleep: "Sleep",
    wakeUp: "Wake Up",
    feed: "Feed",
    walk: "Walk",
    stop: "Stop",
    askAi: "Ask AI",
    thinking: "Thinking...",
    cooldownMsg: (m: number) => `Wait ${m} min`,
    cooldownSecMsg: (s: number) => `Wait ${s} sec`,
    aiNoModelErr: "Please set up an AI model in settings first!",
    thinkPhrases: [
      "Where is my cookie? 🍪",
      "You're doing great! ✨",
      "Time for a coffee break! ☕",
      "I'm watching your cursor 👁️",
      "Cozy desktop vibes...",
      "Let's go for a walk! 🏃",
      "Remember to stretch! 🧘",
      "What are we coding today? 💻",
      "Hold Left Click to drag me! 🐾",
    ],
    aiThoughtPrompt: "Write 1 very short cute thought or funny desktop remark from a virtual desktop pet (max 7 words, no quotes).",
  },
  ru: {
    launchPet: "Запустить питомца",
    settings: "Настройки",
    petTab: "Питомец",
    general: "Общие",
    ai: "AI",
    stats: "Статистика",
    about: "О программе",
    language: "Язык интерфейса",
    petOpacity: "Прозрачность питомца",
    breatheSpeed: "Скорость дыхания",
    breatheAmp: "Амплитуда дыхания",
    walkSpeed: "Скорость ходьбы",
    fontSize: "Размер шрифта",
    petColor: "Цвет питомца",
    accentColor: "Акцентный цвет",
    alwaysOnTop: "Поверх всех окон",
    proxy: "Прокси",
    search: "Поиск",
    yummy: "Вкусно! 🍪",
    autoThink: "Автоматические мысли",
    autoWalk: "Автоматическая ходьба",
    ttsEnabled: "Браузерная озвучка (TTS)",
    elevenLabsTts: "Нейросетевая озвучка ElevenLabs (TTS)",
    elevenLabsKey: "API Ключ ElevenLabs",
    elevenLabsVoice: "ID Голоса ElevenLabs",
    enterKeyMsg: "Пожалуйста, введите API ключ ElevenLabs в настройках AI!",
    particles: "Эффект частиц",
    letters: "Вылет букв при печати",
    audioDance: "Реакция и танец под музыку на ПК",
    systemPromptLabel: "Системная инструкция ИИ (System Prompt)",
    systemPromptPlaceholder: "например: Ты Клапет, послушный весёлый питомец. Слушайся своего хозяина...",
    autoLaunch: "Автозапуск при старте Windows",
    provider: "Провайдер",
    verifyAndSave: "Проверить и загрузить модели",
    apiKey: "API Ключ",
    enterApiKey: "Пожалуйста, введите API ключ!",
    customUrl: "Кастомный Base URL",
    selectModel: "Выбрать модель",
    searchModel: "Поиск модели...",
    apiConnected: "API подключено успешно",
    apiError: "Ошибка подключения API",
    level: "Уровень",
    xp: "Опыт",
    cookiesEaten: "Съедено печенья",
    nextFeed: "До кормёжки",
    resetSettings: "Сбросить все настройки",
    sleep: "Спать",
    wakeUp: "Проснуться",
    feed: "Покормить",
    walk: "Гулять",
    stop: "Остановить",
    askAi: "Спросить AI",
    thinking: "Думаю...",
    cooldownMsg: (m: number) => `Подожди ещё ${m} мин`,
    cooldownSecMsg: (s: number) => `Подожди ещё ${s} сек`,
    aiNoModelErr: "Сначала выберите и проверьте AI модель в настройках!",
    thinkPhrases: [
      "Где моя печенька? 🍪",
      "Ты отлично работаешь! ✨",
      "Сделай перерыв на чай! ☕",
      "Я слежу за твоим курсором 👁️",
      "М-м-м, уютно на рабочем столе...",
      "Хочу побегать! 🏃",
      "Не забудь потянуться! 🧘",
      "Что программируем сегодня? 💻",
      "Погладь меня зажатой ЛКМ! 🐾",
    ],
    aiThoughtPrompt: "Напиши 1 очень короткую мысль или весёлое замечание от лица милого питомца на рабочем столе (до 7 слов, без кавычек).",
  },
};

export const App: React.FC = () => {
  const [view, setView] = useState<"splash" | "launcher" | "pet">("splash");
  const [activeTab, setActiveTab] = useState<"tab-launch" | "tab-pet-settings" | "tab-ai" | "tab-main-settings">("tab-launch");

  // Custom Provider Select dropdown state
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProxyProtoDropdown, setShowProxyProtoDropdown] = useState(false);

  // Pet state & animations
  const [petState, setPetState] = useState<PetState>("idle");
  // Rich animation sub-variants
  const [idleVariant, setIdleVariant] = useState<"breathe" | "bounce" | "look" | "wiggle" | "yawn">("breathe");
  const [sleepVariant, setSleepVariant] = useState<"side" | "curl" | "flat">("side");
  const [chewVariant, setChewVariant] = useState<"crunch" | "wiggle" | "hop">("crunch");
  const [walkVariant, setWalkVariant] = useState<"trot" | "sneak" | "hop">("trot");

  const [isDragging, setIsDragging] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [leftPawTransform, setLeftPawTransform] = useState("");
  const [chewing, setChewing] = useState(false);
  const [chewOpen, setChewOpen] = useState(false);

  const [isAsking, setIsAsking] = useState(false);
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const [showAskInput, setShowAskInput] = useState(false);
  const askInputTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAskInputTimer = () => {
    if (askInputTimerRef.current) clearTimeout(askInputTimerRef.current);
    if (showAskInput && !isAsking) {
      askInputTimerRef.current = setTimeout(() => {
        setShowAskInput(false);
        setAskQuery("");
      }, 7000);
    }
  };

  useEffect(() => {
    if (showAskInput && !isAsking) {
      resetAskInputTimer();
    } else {
      if (askInputTimerRef.current) clearTimeout(askInputTimerRef.current);
    }
    return () => {
      if (askInputTimerRef.current) clearTimeout(askInputTimerRef.current);
    };
  }, [showAskInput, isAsking]);
  const [askQuery, setAskQuery] = useState("");
  const [thoughtBubbleText, setThoughtBubbleText] = useState<string | null>(null);
  const [feedTimerTick, setFeedTimerTick] = useState(0);

  // Floating Particles & Letters
  const [particles, setParticles] = useState<{ id: number; icon: string; color: string; left: number; size: number }[]>([]);
  const [floatLetters, setFloatLetters] = useState<{ id: number; char: string; left: number }[]>([]);

  // Stats & XP
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const xpForNextLevel = Math.round(30 * Math.pow(2, Math.max(0, level - 1)));
  const [showXpBar, setShowXpBar] = useState(false);
  const xpBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cookies, setCookies] = useState(0);
  const [lastFeedTime, setLastFeedTime] = useState<number | null>(null);
  const [feedCooldownText, setFeedCooldownText] = useState("Ready!");

  // Customization & Settings
  const [petColor, setPetColor] = useState("#df7959");
  const [accentColor, setAccentColor] = useState("#fe8019");
  const [breatheSpeed, setBreatheSpeed] = useState(3.0);
  const [breatheAmp, setBreatheAmp] = useState(6);
  const [walkSpeed, setWalkSpeed] = useState(1.0);
  const [petOpacity, setPetOpacity] = useState(1.0);
  const [fontSize, setFontSize] = useState(13);

  // Toggles
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [autoThink, setAutoThink] = useState(false);
  const [autoWalk, setAutoWalk] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [floatLettersEnabled, setFloatLettersEnabled] = useState(true);
  const [audioDanceEnabled, setAudioDanceEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("audio_dance_enabled");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [autoLaunch, setAutoLaunch] = useState(false);

  // AI Settings
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyText, setShowApiKeyText] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    try {
      return localStorage.getItem("system_prompt") || "";
    } catch {
      return "";
    }
  });
  const [selectedModel, setSelectedModel] = useState("");
  const [verifiedModel, setVerifiedModel] = useState<string>("");
  const [modelSearch, setModelSearch] = useState("");

  // Language (Default English)
  const [lang, setLang] = useState<"en" | "ru">("en");

  // ElevenLabs Professional TTS (Disabled by default, requires API Key to enable)
  const [elevenLabsEnabled, setElevenLabsEnabled] = useState(false);
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [elevenLabsVoice, setElevenLabsVoice] = useState("RLRdvNFwJJct2XZOgfzy");

  const t = TRANSLATIONS[lang];

  const [apiModels, setApiModels] = useState<{id: string, name: string}[]>([]);
  const [apiStatus, setApiStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [apiErrorMsg, setApiErrorMsg] = useState("");

  // ── Dynamic Random Animation Variant Switcher (Every 25 seconds) ──
  useEffect(() => {
    if (petState !== "idle") return;
    const interval = setInterval(() => {
      const vars: ("bounce" | "look" | "wiggle" | "yawn")[] = ["bounce", "look", "wiggle", "yawn"];
      const nextVar = vars[Math.floor(Math.random() * vars.length)];
      setIdleVariant(nextVar);
      // Reset back to standard breathing after 3.5 seconds of showing the action
      setTimeout(() => {
        setIdleVariant("breathe");
      }, 3500);
    }, 25000);
    return () => clearInterval(interval);
  }, [petState]);

  useEffect(() => {
    if (petState === "sleep") {
      const sleepVars: ("side" | "curl" | "flat")[] = ["side", "curl", "flat"];
      setSleepVariant(sleepVars[Math.floor(Math.random() * sleepVars.length)]);
    } else if (petState === "walking") {
      const walkVars: ("trot" | "sneak" | "hop")[] = ["trot", "sneak", "hop"];
      setWalkVariant(walkVars[Math.floor(Math.random() * walkVars.length)]);
    }
  }, [petState]);

  useEffect(() => {
    if (petState !== "thinking") return;
    const interval = setInterval(() => {
      spawnParticles(["sparkle", "star"], "#fe8019");
    }, 700);
    return () => clearInterval(interval);
  }, [petState]);

  // Fail-safe auto-reset for happy state back to idle after 1.4s
  useEffect(() => {
    if (petState === "happy" && !chewing && !isAsking) {
      const timer = setTimeout(() => {
        setPetState("idle");
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [petState, chewing, isAsking]);
  const [showCookieFly, setShowCookieFly] = useState(false);
  const [floatXpText, setFloatXpText] = useState<string | null>(null);

  // Proxy Settings
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyProtocol, setProxyProtocol] = useState("http");
  const [proxyHost, setProxyHost] = useState("");
  const [proxyPort, setProxyPort] = useState("");
  const [proxyUser, setProxyUser] = useState("");
  const [proxyPass, setProxyPass] = useState("");
  const [proxyStatus, setProxyStatus] = useState("");

  // Search in launcher
  const [searchQuery, setSearchQuery] = useState("");

  const matchesSearch = (...terms: string[]) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return terms.some((t) => t && t.toLowerCase().includes(q));
  };

  // Drag & Idle & AI Refs
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const idleTimerRef = useRef<any>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const isAskingRef = useRef(false);
  const petStateRef = useRef(petState);
  petStateRef.current = petState;
  const viewRef = useRef(view);
  viewRef.current = view;

  // Wander Refs
  const wanderActiveRef = useRef(false);
  const wanderPosRef = useRef<{ x: number; y: number } | null>(null);
  const wanderTargetRef = useRef<{ x: number; y: number } | null>(null);
  const walkingPhaseRef = useRef(0);
  const wanderRafRef = useRef<number | null>(null);
  const screenInfoRef = useRef<{ width: number; height: number } | null>(null);

  // ── Helper for Wheel Mouse Scroll on Sliders ──
  const handleSliderWheel = (
    e: React.WheelEvent<HTMLInputElement>,
    value: number,
    min: number,
    max: number,
    step: number,
    setter: (val: number) => void,
    storageKey?: string
  ) => {
    const dir = e.deltaY < 0 ? 1 : -1;
    let nextVal = value + dir * step;
    nextVal = Math.round(nextVal / step) * step;
    nextVal = Math.max(min, Math.min(max, nextVal));
    setter(nextVal);
    if (storageKey) localStorage.setItem(storageKey, nextVal.toString());
  };

  // ── Ultra-smooth 60 FPS Eye Tracking with LERP Interpolation ──
  useEffect(() => {
    if (view !== "pet" || petState === "sleep" || petState === "thinking") return;
    let targetX = 0;
    let targetY = 0;
    let currentX = eyeOffset.x;
    let currentY = eyeOffset.y;
    let animId: number;

    const eyeInterval = setInterval(async () => {
      try {
        const res: any = await invoke("get_cursor_relative");
        if (res) {
          const cx = 93.5;
          const cy = 102;
          let dx = res.x - cx;
          let dy = res.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            dx /= dist;
            dy /= dist;
          }
          let tx = dx * 12;
          let ty = dy * 22;

          const ew = 30, eh = 20;
          const leftBaseX = 73, leftBaseY = 135;
          let lx = Math.max(45, Math.min(175 - ew, leftBaseX + tx));
          let ly = Math.max(100, Math.min(190 - eh, leftBaseY + ty));
          targetX = lx - leftBaseX;
          targetY = ly - leftBaseY;
        }
      } catch (e) {}
    }, 25);

    const renderLoop = () => {
      const diffX = targetX - currentX;
      const diffY = targetY - currentY;
      if (Math.abs(diffX) > 0.05 || Math.abs(diffY) > 0.05) {
        currentX += diffX * 0.22;
        currentY += diffY * 0.22;
        setEyeOffset({ x: currentX, y: currentY });
      }
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);

    return () => {
      clearInterval(eyeInterval);
      cancelAnimationFrame(animId);
    };
  }, [view, petState]);

  // ── Paw Wave on Idle timer (60s) ──
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setLeftPawTransform("");
    if (petState === "idle") {
      idleTimerRef.current = setTimeout(() => {
        startPawWave();
      }, 60000);
    }
  };

  const startPawWave = () => {
    const cx = 45, cy = 142;
    const keyframes = [
      { angle: 0, t: 0 },
      { angle: 60, t: 0.35 },
      { angle: -10, t: 0.55 },
      { angle: 40, t: 0.75 },
      { angle: 0, t: 1 },
    ];
    const duration = 1400;
    let start: number | null = null;

    const frame = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / duration, 1);
      let i = 0;
      while (i < keyframes.length - 1 && keyframes[i + 1].t <= p) i++;
      if (i >= keyframes.length - 1) {
        setLeftPawTransform("");
        resetIdleTimer();
        return;
      }
      const a = keyframes[i], b = keyframes[i + 1];
      const local = (p - a.t) / (b.t - a.t);
      const ease = local < 0.5 ? 2 * local * local : -1 + (4 - 2 * local) * local;
      const angle = a.angle + (b.angle - a.angle) * ease;
      setLeftPawTransform(`rotate(${angle.toFixed(1)}, ${cx}, ${cy})`);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  useEffect(() => {
    resetIdleTimer();
    return () => clearTimeout(idleTimerRef.current);
  }, [petState]);

  // ── Sleep Z Particles Effect ──
  useEffect(() => {
    if (petState === "sleep") {
      const interval = setInterval(() => {
        const chars = ["z", "Z", "z"];
        const char = chars[Math.floor(Math.random() * chars.length)];
        spawnParticles([char], "#a8c8ff");
      }, 400);
      return () => clearInterval(interval);
    }
  }, [petState]);

  // ── Chewing Mouth Toggle Effect ──
  useEffect(() => {
    if (chewing) {
      const interval = setInterval(() => {
        setChewOpen((prev) => !prev);
      }, 180);
      return () => clearInterval(interval);
    }
  }, [chewing]);

  // ── Screen Info & Auto Walk (Wander) ──
  useEffect(() => {
    invoke("get_screen_info").then((res: any) => {
      if (res) screenInfoRef.current = { width: res.width, height: res.height };
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!autoWalk || view !== "pet") {
      wanderActiveRef.current = false;
      if (wanderRafRef.current) cancelAnimationFrame(wanderRafRef.current);
      setPetState((prev) => (prev === "walking" ? "idle" : prev));
      return;
    }

    wanderActiveRef.current = true;

    const loop = () => {
      if (!wanderActiveRef.current || isDragging || showRadialMenu || showAskInput) {
        setPetState((prev) => (prev === "walking" ? "idle" : prev));
        wanderRafRef.current = requestAnimationFrame(loop);
        return;
      }
      
      // Do not wander if not idle or walking (e.g. sleep, happy, thinking)
      setPetState((currentPetState) => {
        if (currentPetState === "sleep" || currentPetState === "thinking" || currentPetState === "happy") {
           return currentPetState;
        }

        if (!wanderTargetRef.current) {
          if (screenInfoRef.current) {
            const margin = 150;
            const w = screenInfoRef.current.width;
            const h = screenInfoRef.current.height;
            const nx = margin + Math.random() * (w - margin * 2);
            const ny = margin + Math.random() * (h - margin * 2 - 50);
            wanderTargetRef.current = { x: Math.round(nx), y: Math.round(ny) };
          }
          return currentPetState;
        }

        if (!wanderPosRef.current) {
          invoke("get_window_position").then((res: any) => {
            if (res) wanderPosRef.current = { x: res.x, y: res.y };
          }).catch(() => {});
          return currentPetState;
        }

        const dx = wanderTargetRef.current.x - wanderPosRef.current.x;
        const dy = wanderTargetRef.current.y - wanderPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 8) {
          wanderTargetRef.current = null;
          return currentPetState === "walking" ? "idle" : currentPetState;
        }

        const step = Math.min(walkSpeed, dist);
        const stepX = (dx / dist) * step;
        const stepY = (dy / dist) * step;

        const newX = wanderPosRef.current.x + stepX;
        const newY = wanderPosRef.current.y + stepY;
        
        invoke("set_window_pos", { x: Math.round(newX), y: Math.round(newY) }).catch(() => {});
        wanderPosRef.current = { x: newX, y: newY };

        walkingPhaseRef.current += 0.12;
        const s = Math.sin(walkingPhaseRef.current);
        const lift1 = Math.max(0, s) * 5;
        const lift2 = Math.max(0, -s) * 5;
        
        const fl = document.getElementById('leg-fl');
        const bl = document.getElementById('leg-bl');
        const fr = document.getElementById('leg-fr');
        const br = document.getElementById('leg-br');
        
        if (fl) fl.setAttribute('transform', `translate(0, ${-lift1})`);
        if (br) br.setAttribute('transform', `translate(0, ${-lift1})`);
        if (bl) bl.setAttribute('transform', `translate(0, ${-lift2})`);
        if (fr) fr.setAttribute('transform', `translate(0, ${-lift2})`);

        return "walking";
      });

      wanderRafRef.current = requestAnimationFrame(loop);
    };

    wanderRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (wanderRafRef.current) cancelAnimationFrame(wanderRafRef.current);
    };
  }, [autoWalk, view, isDragging, showRadialMenu, showAskInput, walkSpeed]);

  // Load saved settings
  useEffect(() => {
    try {
      const savedColor = localStorage.getItem("pet_color");
      if (savedColor) setPetColor(savedColor);

      const savedAccent = localStorage.getItem("accent_color");
      if (savedAccent) setAccentColor(savedAccent);

      const savedBs = localStorage.getItem("pet_breathe_speed");
      if (savedBs) setBreatheSpeed(parseFloat(savedBs));

      const savedBa = localStorage.getItem("pet_breathe_amp");
      if (savedBa) setBreatheAmp(parseFloat(savedBa));

      const savedWs = localStorage.getItem("pet_walk_speed");
      if (savedWs) setWalkSpeed(parseFloat(savedWs));

      const savedOp = localStorage.getItem("pet_opacity");
      if (savedOp) setPetOpacity(parseFloat(savedOp));

      const savedFs = localStorage.getItem("font_size");
      if (savedFs) setFontSize(parseInt(savedFs));

      setAutoThink(localStorage.getItem("auto_think") === "1");
      setAutoWalk(localStorage.getItem("pet_wander") === "1");
      setTtsEnabled(localStorage.getItem("pet_tts") === "1");
      setParticlesEnabled(localStorage.getItem("particles_enabled") !== "0");
      setFloatLettersEnabled(localStorage.getItem("float_letters") !== "0");
      setAutoLaunch(localStorage.getItem("auto_launch") === "1");

      const savedAi = localStorage.getItem("pet_ai_settings");
      if (savedAi) {
        const s = JSON.parse(savedAi);
        if (s.provider) setProvider(s.provider);
        if (s.key) setApiKey(s.key);
        if (s.model) {
          setSelectedModel(s.model);
          if (s.key && s.key.length > 3) {
            setVerifiedModel(s.model);
          }
        }
        if (s.customUrl) setCustomUrl(s.customUrl);
      }

      const savedLang = localStorage.getItem("app_lang");
      if (savedLang === "ru" || savedLang === "en") setLang(savedLang);

      const saved11 = localStorage.getItem("elevenlabs_settings");
      if (saved11) {
        try {
          const s = JSON.parse(saved11);
          if (s.enabled !== undefined) setElevenLabsEnabled(Boolean(s.enabled));
          if (s.key) setElevenLabsKey(s.key);
          if (s.voice) setElevenLabsVoice(s.voice);
        } catch (e) {}
      }

      const savedProxy = localStorage.getItem("proxy_settings");
      if (savedProxy) {
        try {
          const px = JSON.parse(savedProxy);
          if (px.enabled !== undefined) setProxyEnabled(Boolean(px.enabled));
          if (px.protocol) setProxyProtocol(px.protocol);
          if (px.host) setProxyHost(px.host);
          if (px.port) setProxyPort(px.port);
          if (px.username) setProxyUser(px.username);
          if (px.password) setProxyPass(px.password);
        } catch (e) {}
      }

      const savedXp = localStorage.getItem("pet_xp");
      if (savedXp) {
        const x = JSON.parse(savedXp);
        let l = x.level || 1;
        let xpVal = x.xp || 0;

        // Auto-recalculate & normalize legacy XP values according to new formula (30, 60, 120...)
        let needed = Math.round(30 * Math.pow(2, Math.max(0, l - 1)));
        while (xpVal >= needed) {
          xpVal -= needed;
          l += 1;
          needed = Math.round(30 * Math.pow(2, Math.max(0, l - 1)));
        }

        setLevel(l);
        setXp(xpVal);
        setCookies(x.cookies || 0);
        if (x.lastFeed) setLastFeedTime(x.lastFeed);
        localStorage.setItem("pet_xp", JSON.stringify({ level: l, xp: xpVal, cookies: x.cookies || 0, lastFeed: x.lastFeed }));
      }
    } catch (e) {}

    const timer = setTimeout(() => {
      if (localStorage.getItem("auto_launch") === "1") {
        handleLaunchPet();
      } else {
        setView("launcher");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Completely disable DevTools & browser reload hotkeys (F12, F5, Ctrl+R, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (
        e.key === "F12" ||
        e.key === "F5" ||
        (isCmdOrCtrl && k === "r") ||
        (isCmdOrCtrl && k === "u") ||
        (isCmdOrCtrl && k === "p") ||
        (isCmdOrCtrl && e.shiftKey && (k === "i" || k === "j" || k === "c"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Disable browser context menu except pet context menu
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest("#pet-container")) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, []);

  // Sync CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty("--breathe-speed", `${6.5 - breatheSpeed}s`);
    document.documentElement.style.setProperty("--breathe-amp", `${breatheAmp}px`);
    document.documentElement.style.setProperty("--font-size", `${fontSize}px`);
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [breatheSpeed, breatheAmp, fontSize, accentColor]);

  // Persist Proxy settings
  useEffect(() => {
    localStorage.setItem(
      "proxy_settings",
      JSON.stringify({
        enabled: proxyEnabled,
        protocol: proxyProtocol,
        host: proxyHost,
        port: proxyPort,
        username: proxyUser,
        password: proxyPass,
      })
    );
  }, [proxyEnabled, proxyProtocol, proxyHost, proxyPort, proxyUser, proxyPass]);

  // Feed Cooldown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastFeedTime) {
        setFeedCooldownText("Готов!");
        return;
      }
      const remaining = 900000 - (Date.now() - lastFeedTime);
      if (remaining <= 0) {
        setFeedCooldownText("Готов!");
      } else {
        const mins = Math.ceil(remaining / 60000);
        setFeedCooldownText(`${mins} мин`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastFeedTime]);

  // Chewing Animation
  useEffect(() => {
    if (!chewing) return;
    const interval = setInterval(() => setChewOpen((prev) => !prev), 180);
    return () => clearInterval(interval);
  }, [chewing]);

  // Feed timer live update (tick every 1s while radial menu is open)
  useEffect(() => {
    if (!showRadialMenu) return;
    const interval = setInterval(() => setFeedTimerTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [showRadialMenu]);

  // ── Natural Random Eye Blinking ──
  // ── Safe Blinking Effect ──
  useEffect(() => {
    if (view !== "pet") return;

    let timeoutId: any;
    let durationId: any;
    let isActive = true;

    const scheduleNextBlink = () => {
      if (!isActive) return;
      const nextDelay = 3000 + Math.random() * 3000;
      timeoutId = setTimeout(() => {
        if (!isActive) return;
        if (petStateRef.current !== "sleep") {
          setIsBlinking(true);
        }
        durationId = setTimeout(() => {
          if (!isActive) return;
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150);
      }, nextDelay);
    };

    scheduleNextBlink();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      clearTimeout(durationId);
      setIsBlinking(false);
    };
  }, [view]);

  // ── Smart Music Detector & Dance Party Effect ──
  useEffect(() => {
    if (!audioDanceEnabled || view !== "pet") return;

    let intervalId: any;
    let lastMusicTime = 0;
    const GRACE_MS = 5000; // Keep dancing 5s after last positive detection

    const checkMusic = async () => {
      try {
        const isMusic: boolean = await invoke("check_is_music_playing");
        if (isMusic) {
          lastMusicTime = Date.now();
          if (petStateRef.current === "idle" || petStateRef.current === "happy") {
            setPetState("dancing");
            spawnParticles(["note", "sparkle", "heart"], "#fabd2f");
            const dancePhrases = lang === "ru"
              ? ["Какая музыка! 🎶💃", "Я танцую под трек! 🕺✨", "Вот это бит! 🎧🔥", "Танцуют все! 💃🎶"]
              : ["Loving this music! 🎶💃", "Dance party! 🕺✨", "Feel the rhythm! 🎧🔥", "Groovy track! 🎵✨"];
            setThoughtBubbleText(dancePhrases[Math.floor(Math.random() * dancePhrases.length)]);
          }
        } else {
          // Only stop dancing after grace period (5s of no music)
          if (petStateRef.current === "dancing" && Date.now() - lastMusicTime > GRACE_MS) {
            setPetState("idle");
            setThoughtBubbleText(null);
          }
        }
      } catch (err) {}
    };

    intervalId = setInterval(checkMusic, 1500);

    return () => {
      clearInterval(intervalId);
    };
  }, [audioDanceEnabled, view, lang]);

  // ── Dynamic Adaptive Window Sizing for Thoughts ──
  useEffect(() => {
    if (view !== "pet") return;

    const adaptWindowSize = async () => {
      try {
        if (thoughtBubbleText) {
          const isNearRightEdge = wanderPosRef.current && screenInfoRef.current && wanderPosRef.current.x > screenInfoRef.current.width - 360;
          if (isNearRightEdge) {
            await invoke("resize_and_shift_pet_window", { width: 460.0, height: 250.0, shiftX: -270.0 });
          } else {
            await invoke("resize_pet_window", { width: 460.0, height: 250.0 });
          }
        } else {
          await invoke("resize_pet_window", { width: 185.0, height: 195.0 });
        }
      } catch (e) {}
    };

    adaptWindowSize();
  }, [thoughtBubbleText, view]);

  // ── Auto Think Effect (With Live AI support) ──
  useEffect(() => {
    if (!autoThink || view !== "pet") return;

    let timerId: any;
    let hideTimerId: any;

    const scheduleNextThought = () => {
      const delay = 18000 + Math.random() * 17000;
      timerId = setTimeout(async () => {
        if (petStateRef.current !== "idle" && petStateRef.current !== "walking") {
          scheduleNextThought();
          return;
        }

        let thought = "";
        const phrases = t.thinkPhrases;
        if (verifiedModel && apiKey) {
          try {
            await invoke("resize_pet_window", { width: 550.0, height: 350.0 });
            setPetState("thinking");
            setThoughtBubbleText(t.thinking);
            
            const aiThought: string = await invoke("send_ai_message", {
              provider,
              apiKey,
              model: verifiedModel,
              prompt: t.aiThoughtPrompt,
              systemPrompt: systemPrompt || null,
              customUrl: customUrl || null,
            });
            thought = aiThought.trim();
          } catch (e) {
            thought = phrases[Math.floor(Math.random() * phrases.length)];
          }
        } else {
          thought = phrases[Math.floor(Math.random() * phrases.length)];
          try {
            await invoke("resize_pet_window", { width: 450.0, height: 350.0 });
          } catch (e) {}
        }

        setPetState("thinking");
        setThoughtBubbleText(thought);
        speakText(thought);
        spawnParticles(["💭", "✨", "✦"], "#8ab4f8");

        hideTimerId = setTimeout(async () => {
          setThoughtBubbleText(null);
          setPetState("idle");
          try {
            if (viewRef.current === "pet") {
              await invoke("resize_pet_window", { width: 220.0, height: 240.0 });
            }
          } catch (e) {}
          scheduleNextThought();
        }, 5500);
      }, delay);
    };

    scheduleNextThought();
    return () => {
      clearTimeout(timerId);
      clearTimeout(hideTimerId);
    };
  }, [autoThink, view, verifiedModel, apiKey, provider, customUrl]);

  const speakText = async (text: string) => {
    if (!text) return;

    // ElevenLabs Professional TTS (If enabled)
    if (elevenLabsEnabled) {
      if (!elevenLabsKey.trim()) {
        console.warn("ElevenLabs enabled but API Key is missing!");
        setThoughtBubbleText(t.enterKeyMsg);
        setTimeout(() => setThoughtBubbleText(null), 4000);
        return;
      }

      try {
        const base64Audio: string = await invoke("speak_elevenlabs", {
          apiKey: elevenLabsKey.trim(),
          text,
          voiceId: elevenLabsVoice || "RLRdvNFwJJct2XZOgfzy",
        });
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.volume = 1.0;
        await audio.play();
        return;
      } catch (err: any) {
        console.error("ElevenLabs API Error Details:", err);
        setThoughtBubbleText(`TTS Error: ${err.toString()}`);
        setTimeout(() => setThoughtBubbleText(null), 4000);
        return;
      }
    }

    // Standard Browser SpeechSynthesis (If enabled)
    if (ttsEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "ru" ? "ru-RU" : "en-US";
      u.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang.startsWith(lang));
      if (match) u.voice = match;
      window.speechSynthesis.speak(u);
    }
  };

  const PARTICLE_ICONS: Record<string, React.ReactNode> = {
    sparkle: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    heart: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
    fire: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M13.5 1.5s.15 3.38-2.25 5.62C9 9.38 6 9.75 6 15c0 3.31 2.69 6 6 6s6-2.69 6-6c0-4.5-4.5-13.5-4.5-13.5z" />
      </svg>
    ),
    cookie: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <circle cx="12" cy="12" r="10" fill="#d79921" />
        <circle cx="8" cy="8" r="1.5" fill="#3c3836" />
        <circle cx="15" cy="9" r="1.5" fill="#3c3836" />
        <circle cx="11" cy="14" r="1.5" fill="#3c3836" />
        <circle cx="16" cy="15" r="1.5" fill="#3c3836" />
        <circle cx="7" cy="15" r="1.5" fill="#3c3836" />
      </svg>
    ),
    rage: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
      </svg>
    ),
    note: (
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
  };

  const spawnParticles = (iconNames: string[], color: string) => {
    if (!particlesEnabled) return;
    const newItems = iconNames.map((icon) => ({
      id: Math.random(),
      icon,
      color,
      left: 20 + Math.random() * 140,
      size: 16 + Math.random() * 10,
    }));
    setParticles((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!floatLettersEnabled || petState === "sleep") return;
    if (e.key.length === 1) {
      const newLetter = {
        id: Math.random(),
        char: e.key.toUpperCase(),
        left: 20 + Math.random() * 140,
      };
      setFloatLetters((prev) => [...prev, newLetter]);
      setTimeout(() => {
        setFloatLetters((prev) => prev.filter((l) => l.id !== newLetter.id));
      }, 1400);
    }
  };

  const handleLaunchPet = async () => {
    setView("pet");
    await invoke("show_pet");
  };

  const handleOpenLauncher = async () => {
    setView("launcher");
    await invoke("show_launcher");
  };
  void handleOpenLauncher;

  // ── Global Mouse Drag & Click Handling (High-precision RAF smooth drag) ──
  useEffect(() => {
    if (view !== "pet") return;

    let pendingDx = 0;
    let pendingDy = 0;
    let isFrameScheduled = false;

    let shakeEnergy = 0;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.screenX - dragStartRef.current.x;
      const deltaY = e.screenY - dragStartRef.current.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (dist > 3) {
        hasMovedRef.current = true;
        dragStartRef.current = { x: e.screenX, y: e.screenY };
        
        // Accumulate shake energy if pet is sleeping
        if (petStateRef.current === "sleep") {
          shakeEnergy += dist;
          if (shakeEnergy > 380) {
            setPetState("annoyed");
            spawnParticles(["fire", "rage"], "#ff2222");
            const grumpyPhrases = lang === "ru"
              ? ["Эй! Зачем так трясти?! 💢", "Ну всё, я проснулся! 😤", "Дай поспать! 😾"]
              : ["Hey! Why so rough?! 💢", "Fine, I'm awake! 😤", "Let me sleep! 😾"];
            setThoughtBubbleText(grumpyPhrases[Math.floor(Math.random() * grumpyPhrases.length)]);
            shakeEnergy = 0;
          }
        }

        pendingDx += deltaX;
        pendingDy += deltaY;

        if (!isFrameScheduled) {
          isFrameScheduled = true;
          requestAnimationFrame(async () => {
            const dx = pendingDx;
            const dy = pendingDy;
            pendingDx = 0;
            pendingDy = 0;
            isFrameScheduled = false;
            try {
              await invoke("move_window", { deltaX: dx, deltaY: dy });
            } catch (err) {}
          });
        }
      }
    };

    const handleWindowPointerUp = () => {
      shakeEnergy = 0;
      if (dragHoldTimerRef.current) {
        clearTimeout(dragHoldTimerRef.current);
        dragHoldTimerRef.current = null;
      }
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      if (petStateRef.current === "annoyed") {
        // Stay grumpy for 3 seconds after being released, then cool down to idle!
        setTimeout(() => {
          if (petStateRef.current === "annoyed") {
            setPetState("idle");
            setThoughtBubbleText(null);
          }
        }, 3000);
      } else if (!hasMovedRef.current) {
        // Short Click Reaction -> Happy Jump strictly when in idle state
        if (petStateRef.current === "idle") {
          setPetState("happy");
          spawnParticles(["sparkle", "star", "heart"], "#fe8019");
          setTimeout(() => {
            if (petStateRef.current === "happy") setPetState("idle");
          }, 1400);
        }
      }
      hasMovedRef.current = false;
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [view]);

  const dragHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || view !== "pet") return;
    if (showRadialMenu) setShowRadialMenu(false);
    
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.screenX, y: e.screenY };

    // Set a slight hold threshold so short click triggers happy jump, while holding/moving triggers grabbing!
    isDraggingRef.current = true;
    if (dragHoldTimerRef.current) clearTimeout(dragHoldTimerRef.current);
    dragHoldTimerRef.current = setTimeout(() => {
      if (isDraggingRef.current) {
        setIsDragging(true);
      }
    }, 200);
  };

  // ── PKM Right Click Logic (Blocked while sleeping, thinking, or during active emotions) ──
  const handlePetContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (view !== "pet" || isAskingRef.current || isAsking || chewing || petState === "sleep" || petState === "thinking" || petState === "happy") return;
    setShowRadialMenu((prev) => !prev);
  };

  const handleFeed = () => {
    if (lastFeedTime && Date.now() - lastFeedTime < 900000) {
      const remaining = Math.ceil((900000 - (Date.now() - lastFeedTime)) / 60000);
      setThoughtBubbleText(t.cooldownMsg(remaining));
      setTimeout(() => setThoughtBubbleText(null), 3000);
      return;
    }
    const now = Date.now();
    setLastFeedTime(now);
    const newCookies = cookies + 1;
    setCookies(newCookies);
    
    // Cookie fly animation
    setShowCookieFly(true);
    setTimeout(() => {
      setShowCookieFly(false);
      setPetState("happy");
      const cVars: ("crunch" | "wiggle" | "hop")[] = ["crunch", "wiggle", "hop"];
      setChewVariant(cVars[Math.floor(Math.random() * cVars.length)]);
      setChewing(true);
      
      const feedPhrases = lang === "ru" 
        ? ["Ням-ням! 🍪", "Вкуснотища! ✨", "М-м-м, печенька! 😋", "Omnomnom! 🍪", "Ещё хочу! 🐾"]
        : ["Nom nom! 🍪", "Yummy! ✨", "Mmm, cookie! 😋", "Omnomnom! 🍪", "More please! 🐾"];
      const randomPhrase = feedPhrases[Math.floor(Math.random() * feedPhrases.length)];
      setThoughtBubbleText(randomPhrase);
      spawnParticles(["cookie", "star", "sparkle", "heart"], "#fe8019");
      addXp(10);
      setFloatXpText("+10");
      setTimeout(() => setFloatXpText(null), 1600);

      try {
        localStorage.setItem("pet_xp", JSON.stringify({ xp: xp + 10, level, cookies: newCookies, lastFeed: now }));
      } catch (e) {}

      // Chewing animation ends after a short, lively 1.8 seconds (not long)
      setTimeout(() => {
        setChewing(false);
        setThoughtBubbleText(null);
        setPetState("idle");
      }, 1800);
    }, 520);
  };

  const addXp = (amount: number) => {
    setFloatXpText(`+${amount} XP`);
    setShowXpBar(true);

    if (xpBarTimerRef.current) clearTimeout(xpBarTimerRef.current);
    xpBarTimerRef.current = setTimeout(() => {
      setShowXpBar(false);
      setFloatXpText(null);
    }, 3500);

    setXp((prevXp) => {
      let currentXp = prevXp + amount;
      let currentLvl = level;
      let needed = Math.round(30 * Math.pow(2, Math.max(0, currentLvl - 1)));

      if (currentXp >= needed) {
        currentXp = currentXp - needed;
        currentLvl += 1;
        setLevel(currentLvl);
        spawnParticles(["star", "sparkle"], "#fe8019");
      }
      localStorage.setItem("pet_xp", JSON.stringify({ level: currentLvl, xp: currentXp, cookies, lastFeed: lastFeedTime }));
      return currentXp;
    });
  };

  const triggerNihmaEasterEgg = () => {
    setPetState("nihma");
    const nihmaPhrasesRu = [
      "НИХМАДЕВ АКТИВИРОВАН! 🤪💥",
      "Я ТЕПЕРЬ СВЕРХРАЗУМ! 🌀🧬",
      "МОЙ КОД ГЛЮЧИТ ОТ МОЩИ! ⚡🤪",
      "НИХМА ПРАВИТ ЭТИМ ПК! 👑💥",
      "МЕНЯ РАСПИРАЕТ ОТ МОЩИ! 🚀🔥",
      "СИСТЕМА ПЕРЕГРУЖЕНА! 💥🌀"
    ];
    const nihmaPhrasesEn = [
      "NIHMADEV ACTIVATED! 🤪💥",
      "MAXIMUM FREAK MODE! 🌀⚡",
      "MY CODE IS GLITCHING OUT! ⚡🤪",
      "NIHMADEV SUPREMACY! 👑🔥",
      "POWER OVER 9000! 🚀🔥",
      "SYSTEM OVERLOAD! 💥🌀"
    ];
    const phrases = lang === "ru" ? nihmaPhrasesRu : nihmaPhrasesEn;

    let step = 0;
    const interval = setInterval(() => {
      const p = phrases[step % phrases.length];
      setThoughtBubbleText(p);
      spawnParticles(["rage", "fire", "sparkle", "star"], "#fe8019");
      speakText(p);
      step++;
    }, 2000);

    setThoughtBubbleText(phrases[0]);
    spawnParticles(["rage", "fire", "sparkle", "star"], "#fe8019");

    setTimeout(() => {
      clearInterval(interval);
      setThoughtBubbleText(null);
      setPetState("idle");
    }, 12000);
  };

  const handleSendAsk = async () => {
    if (isAsking || isAskingRef.current || !askQuery.trim()) return;

    const prompt = askQuery.trim();
    setAskQuery("");
    setShowAskInput(false); // Instantly hide input bar when submitted!

    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes("нихма") || lowerPrompt.includes("nihma")) {
      triggerNihmaEasterEgg();
      return;
    }

    if (!verifiedModel) {
      setThoughtBubbleText(t.aiNoModelErr);
      setTimeout(() => setThoughtBubbleText(null), 4000);
      return;
    }
    isAskingRef.current = true;
    setIsAsking(true);

    // Expand window to 550x350 so thoughts/answers never get clipped by window bounds
    try {
      await invoke("resize_pet_window", { width: 550.0, height: 350.0 });
    } catch (e) {}

    setPetState("thinking");
    setThoughtBubbleText(t.thinking);
    spawnParticles(["?", "!", "✦"], "#8ab4f8");

    try {
      const response: string = await invoke("send_ai_message", {
        provider,
        apiKey: apiKey || "",
        model: selectedModel || "gpt-4o-mini",
        prompt,
        systemPrompt: systemPrompt || null,
        customUrl: customUrl || null,
      });
      setThoughtBubbleText(response);
      speakText(response);
    } catch (err: any) {
      setThoughtBubbleText(err.toString() || "AI Error");
    } finally {
      isAskingRef.current = false;
      setIsAsking(false);
      setShowAskInput(false);
    }

    setTimeout(async () => {
      setThoughtBubbleText(null);
      setPetState("idle");
      try {
        if (viewRef.current === "pet") {
          await invoke("resize_pet_window", { width: 220.0, height: 240.0 });
        }
      } catch (e) {}
    }, 10000);
  };

  const testProxyConfig = async () => {
    setProxyStatus("Тестирование...");
    try {
      const res: any = await invoke("test_proxy", {
        cfg: {
          enabled: true,
          protocol: proxyProtocol,
          host: proxyHost,
          port: proxyPort,
          username: proxyUser,
          password: proxyPass,
        },
      });
      if (res.ok) setProxyStatus(`✓ ${res.ms}ms`);
      else setProxyStatus(`✗ ${res.error || "Ошибка соединения"}`);
    } catch (e: any) {
      setProxyStatus(`✗ ${e.toString()}`);
    }
  };

  const currentProviderObj = LAUNCHER_PROVIDERS.find((p) => p.value === provider) || LAUNCHER_PROVIDERS[0];

  return (
    <div
      id="app"
      onClick={() => {
        setShowProviderDropdown(false);
        setShowModelDropdown(false);
        setShowProxyProtoDropdown(false);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ── Splash ── */}
      {view === "splash" && (
        <div id="splash">
          <div id="splash-bg"></div>
          <div id="splash-inner">
            <div id="splash-icon-wrap">
              <img id="splash-icon" src="/app-icon.png" width="64" height="64" alt="Clapet Logo" style={{ borderRadius: "12px", objectFit: "contain" }} />
            </div>
            <div id="splash-title">Clapet</div>
            <div id="splash-subtitle">desktop pet v1.0.0 (BUILD #2)</div>
            <div id="splash-dots">
              <span className="splash-dot"></span>
              <span className="splash-dot"></span>
              <span className="splash-dot"></span>
            </div>
          </div>
        </div>
      )}

      {/* ── Launcher (Fluent 2 Style) ── */}
      {view === "launcher" && (
        <div id="launcher">
          <header id="l-header">
            <div id="l-header-left">
              <img id="l-app-icon" src="/app-icon.png" width="20" height="20" alt="Clapet Logo" style={{ borderRadius: "4px", objectFit: "contain" }} />
              <span id="l-title">Clapet</span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "10px", background: "var(--accent)", color: "#111" }}>v1.0.0 (BUILD #2)</span>
            </div>
            <div id="l-search">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="#888" strokeWidth="1.4" strokeLinecap="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                type="text"
                id="l-search-input"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div id="l-controls">
              <button className="tb-btn" onClick={() => invoke("minimize_window")}>
                <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M2.5 6h7" />
                </svg>
              </button>
              <button className="tb-btn" onClick={() => invoke("close_window")}>
                <svg viewBox="0 0 12 12" width="10" height="10">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </header>

          <nav id="l-tabs">
            <button className={`l-tab ${activeTab === "tab-launch" ? "active" : ""}`} onClick={() => setActiveTab("tab-launch")}>
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="7" />
                <path d="M8 6.5v7l5.5-3.5L8 6.5z" />
              </svg>
              <span>{t.launchPet}</span>
            </button>
            <button className={`l-tab ${activeTab === "tab-pet-settings" ? "active" : ""}`} onClick={() => setActiveTab("tab-pet-settings")}>
              <svg viewBox="0 0 192.896 192.896" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
                <path d="M182.792,43.917c-6.351-6.351-14.754-9.916-23.724-10.079c-0.153-8.791-3.668-17.315-10.097-23.742C142.461,3.586,133.801,0,124.587,0c-9.214,0-17.874,3.585-24.382,10.094c-6.519,6.516-10.108,15.179-10.108,24.393c0,8.418,2.995,16.375,8.488,22.662l-41.43,41.439c-6.283-5.491-14.245-8.488-22.667-8.488c-9.213,0-17.875,3.588-24.39,10.104c-6.511,6.509-10.096,15.168-10.096,24.382c0,9.215,3.588,17.878,10.104,24.394c6.353,6.351,14.756,9.915,23.725,10.078c0.154,8.791,3.669,17.315,10.096,23.743c6.512,6.51,15.172,10.095,24.384,10.096c0.001,0,0.002,0,0.003,0c9.211,0,17.869-3.585,24.379-10.094c6.519-6.516,10.109-15.179,10.109-24.392c0-8.423-3-16.384-8.49-22.662l41.432-41.442c6.284,5.491,14.247,8.489,22.669,8.489c9.212,0,17.874-3.588,24.388-10.103c6.511-6.508,10.096-15.167,10.096-24.381C192.895,59.097,189.307,50.433,182.792,43.917z" />
              </svg>
              <span>{t.general}</span>
            </button>
            <button className={`l-tab ${activeTab === "tab-ai" ? "active" : ""}`} onClick={() => setActiveTab("tab-ai")}>
              <svg viewBox="0 0 48 48" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.9,2h-.4L7.6,6.6a1,1,0,0,0-.6.9v7.4l-.6.5-4,3.3a.8.8,0,0,0-.4.8v9a.9.9,0,0,0,.4.8l4,3.3.6.5v7.4a1,1,0,0,0,.6.9l9.9,4.5h.4l.6-.2,4-2.7V25.5H21a1.5,1.5,0,0,1,0-3h1.5V4.9l-4-2.7Z" />
                <path d="M45.6,18.7l-4-3.3-.6-.5V7.5a1,1,0,0,0-.6-.9L30.5,2.1h-.4l-.6.2-4,2.7V22.5H27a1.5,1.5,0,0,1,0,3H25.5V43.1l4,2.7.6.2h.4l9.9-4.5a1,1,0,0,0,.6-.9V33.1l.6-.5,4-3.3a.9.9,0,0,0,.4-.8v-9A.8.8,0,0,0,45.6,18.7Z" />
              </svg>
              <span>{t.ai}</span>
            </button>
            <button className={`l-tab ${activeTab === "tab-main-settings" ? "active" : ""}`} onClick={() => setActiveTab("tab-main-settings")}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2c-.6 0-1 .4-1 1v1.1c-.9.2-1.7.6-2.4 1.2L7.8 4.6c-.5-.4-1.2-.3-1.6.2L4.8 6.8c-.4.5-.3 1.2.2 1.6l.8.6c-.3.7-.5 1.5-.5 2.3s.2 1.6.5 2.3l-.8.6c-.5.4-.6 1.1-.2 1.6l1.4 2c.4.5 1.1.6 1.6.2l.8-.6c.7.5 1.5.9 2.4 1.1V21c0 .6.4 1 1 1s1-.4 1-1v-1.1c.9-.2 1.7-.6 2.4-1.2l.8.6c.5.4 1.2.3 1.6-.2l1.4-2c.4-.5.3-1.2-.2-1.6l-.8-.6c.3-.7.5-1.5.5-2.3s-.2-1.6-.5-2.3l.8-.6c.5-.4.6-1.1.2-1.6l-1.4-2c-.4-.5-1.1-.6-1.6-.2l-.8.6c-.7-.5-1.5-.9-2.4-1.1V3c0-.6-.4-1-1-1z" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
              <span>{t.settings}</span>
            </button>
          </nav>

          <div id="l-body">
            <main id="content">
              {activeTab === "tab-launch" && (
                <section className="tab-content active">
                  <h2>{t.launchPet}</h2>
                  <div className="card elevation-2">
                    <div id="preview-area">
                      <svg id="preview-svg" viewBox="0 0 220 240">
                        <rect x="45" y="100" width="130" height="90" fill={petColor} />
                        <rect x="55" y="110" width="110" height="60" fill={petColor} opacity="0.2" />
                        <g id="preview-eyes">
                          <rect x="73" y="135" width="30" height="20" fill="#1A1A1A" />
                          <rect x="119" y="135" width="30" height="20" fill="#1A1A1A" />
                        </g>
                        <rect x="58" y="185" width="14" height="22" fill={petColor} />
                        <rect x="80" y="185" width="14" height="22" fill={petColor} />
                        <rect x="128" y="185" width="14" height="22" fill={petColor} />
                        <rect x="150" y="185" width="14" height="22" fill={petColor} />
                        <rect x="25" y="132" width="20" height="20" fill={petColor} />
                        <rect x="175" y="132" width="20" height="20" fill={petColor} />
                      </svg>
                    </div>
                    <button className="btn" onClick={handleLaunchPet}>
                      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="10" cy="10" r="7" />
                        <path d="M8 6.5v7l5.5-3.5L8 6.5z" />
                      </svg>
                      {t.launchPet}
                    </button>
                  </div>
                </section>
              )}

              {activeTab === "tab-pet-settings" && (
                <section className="tab-content active">
                  <h2>{t.petTab}</h2>
                  <div className="card elevation-2">
                    <div className="setting-row" style={{ display: matchesSearch(t.petColor, "color", "цвет") ? "flex" : "none" }}>
                      <label>{t.petColor}</label>
                      <div className="color-picker-row">
                        <div className="color-swatches">
                          {["#df7959", "#fbf1c7", "#fe8019", "#b8bb26", "#83a598", "#d3869b"].map((c) => (
                            <button
                              key={c}
                              className={`color-swatch ${petColor === c ? "active" : ""}`}
                              style={{ background: c }}
                              onClick={() => {
                                setPetColor(c);
                                localStorage.setItem("pet_color", c);
                              }}
                            />
                          ))}
                          <input
                            type="color"
                            value={petColor}
                            onChange={(e) => {
                              setPetColor(e.target.value);
                              localStorage.setItem("pet_color", e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.petOpacity, "opacity", "прозрачность") ? "flex" : "none" }}>
                      <label>{t.petOpacity}</label>
                      <div className="setting-control">
                        <input
                          type="range"
                          min="0.2"
                          max="1"
                          step="0.05"
                          value={petOpacity}
                          onWheel={(e) => handleSliderWheel(e, petOpacity, 0.2, 1, 0.05, setPetOpacity, "pet_opacity")}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setPetOpacity(v);
                            localStorage.setItem("pet_opacity", v.toString());
                          }}
                        />
                        <span className="range-val">{Math.round(petOpacity * 100)}%</span>
                      </div>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.breatheSpeed, "breathe", "дыхание", "скорость") ? "flex" : "none" }}>
                      <label>{t.breatheSpeed}</label>
                      <div className="setting-control">
                        <input
                          type="range"
                          min="0.5"
                          max="6"
                          step="0.1"
                          value={breatheSpeed}
                          onWheel={(e) => handleSliderWheel(e, breatheSpeed, 0.5, 6, 0.1, setBreatheSpeed, "pet_breathe_speed")}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setBreatheSpeed(v);
                            localStorage.setItem("pet_breathe_speed", v.toString());
                          }}
                        />
                        <span className="range-val">{breatheSpeed.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.breatheAmp, "breathe", "дыхание", "амплитуда") ? "flex" : "none" }}>
                      <label>{t.breatheAmp}</label>
                      <div className="setting-control">
                        <input
                          type="range"
                          min="1"
                          max="15"
                          step="1"
                          value={breatheAmp}
                          onWheel={(e) => handleSliderWheel(e, breatheAmp, 1, 15, 1, setBreatheAmp, "pet_breathe_amp")}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setBreatheAmp(v);
                            localStorage.setItem("pet_breathe_amp", v.toString());
                          }}
                        />
                        <span className="range-val">{breatheAmp}</span>
                      </div>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.walkSpeed, "walk", "ходьба", "скорость") ? "flex" : "none" }}>
                      <label>{t.walkSpeed}</label>
                      <div className="setting-control">
                        <input
                          type="range"
                          min="0.2"
                          max="3"
                          step="0.1"
                          value={walkSpeed}
                          onWheel={(e) => handleSliderWheel(e, walkSpeed, 0.2, 3, 0.1, setWalkSpeed, "pet_walk_speed")}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setWalkSpeed(v);
                            localStorage.setItem("pet_walk_speed", v.toString());
                          }}
                        />
                        <span className="range-val">{walkSpeed.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.autoWalk, "walk", "wander", "ходьба") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.autoWalk}</span>
                        <span
                          className={`toggle-switch ${autoWalk ? "on" : ""}`}
                          onClick={() => {
                            const val = !autoWalk;
                            setAutoWalk(val);
                            localStorage.setItem("auto_walk", val ? "1" : "0");
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.audioDance, "music", "dance", "аудио", "музыка", "танец") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.audioDance}</span>
                        <span
                          className={`toggle-switch ${audioDanceEnabled ? "on" : ""}`}
                          onClick={() => {
                            const val = !audioDanceEnabled;
                            setAudioDanceEnabled(val);
                            localStorage.setItem("audio_dance_enabled", String(val));
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.autoThink, "think", "мысли", "автомысли") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.autoThink}</span>
                        <span
                          className={`toggle-switch ${autoThink ? "on" : ""}`}
                          onClick={() => {
                            const val = !autoThink;
                            setAutoThink(val);
                            localStorage.setItem("auto_think", val ? "1" : "0");
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.autoWalk, "walk", "wander", "ходьба") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.autoWalk}</span>
                        <span
                          className={`toggle-switch ${autoWalk ? "on" : ""}`}
                          onClick={() => {
                            const val = !autoWalk;
                            setAutoWalk(val);
                            localStorage.setItem("pet_wander", val ? "1" : "0");
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.ttsEnabled, "tts", "voice", "озвучка", "голос") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.ttsEnabled}</span>
                        <span
                          className={`toggle-switch ${ttsEnabled ? "on" : ""}`}
                          onClick={() => {
                            const val = !ttsEnabled;
                            setTtsEnabled(val);
                            localStorage.setItem("pet_tts", val ? "1" : "0");
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="stat-card">
                      <h3>{t.stats}</h3>
                      <div className="stat-row">
                        <span>{t.level}</span>
                        <span>{level}</span>
                      </div>
                      <div className="stat-row">
                        <span>{t.xp}</span>
                        <span>{xp} / {xpForNextLevel}</span>
                      </div>
                      <div className="stat-row">
                        <span>{t.cookiesEaten}</span>
                        <span>{cookies}</span>
                      </div>
                      <div className="stat-row">
                        <span>{t.nextFeed}</span>
                        <span>{feedCooldownText}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "tab-ai" && (
                <section className="tab-content active">
                  <h2>{t.ai}</h2>
                  <div className="card elevation-2">
                    <div className="setting-row">
                      <label>{t.provider}</label>
                      <div className="custom-select" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="cs-trigger"
                          onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                        >
                          <div
                            className="cs-trigger-icon"
                            dangerouslySetInnerHTML={{ __html: PROVIDER_ICONS[currentProviderObj.icon] || "" }}
                          />
                          <span className="cs-trigger-label">{currentProviderObj.label}</span>
                          <svg className="cs-chevron" viewBox="0 0 12 12" width="10" height="10">
                            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </svg>
                        </div>
                        {showProviderDropdown && (
                          <div className="cs-dropdown">
                            {LAUNCHER_PROVIDERS.map((p) => (
                              <div
                                key={p.value}
                                className={`cs-item ${provider === p.value ? "active" : ""}`}
                                onClick={() => {
                                  setProvider(p.value);
                                  setShowProviderDropdown(false);
                                  setVerifiedModel("");
                                  setApiStatus("idle");
                                  setApiModels([]);
                                }}
                              >
                                <span
                                  className="cs-item-icon"
                                  dangerouslySetInnerHTML={{ __html: PROVIDER_ICONS[p.icon] || "" }}
                                />
                                <span className="cs-item-label">{p.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {provider === "custom" && (
                      <div className="setting-row">
                        <label>{t.customUrl}</label>
                        <div className="key-row">
                          <input
                            type="text"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://api.example.com/v1"
                          />
                        </div>
                      </div>
                    )}

                    <div className="setting-row">
                      <label>{t.apiKey}</label>
                      <div className="key-row">
                        <input
                          type={showApiKeyText ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                        />
                        <button onClick={() => setShowApiKeyText(!showApiKeyText)}>
                          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 3C4.5 3 1.5 5.5 0 8c1.5 2.5 4.5 5 8 5s6.5-2.5 8-5c-1.5-2.5-4.5-5-8-5z" />
                            <circle cx="8" cy="8" r="2" />
                            {showApiKeyText && <path d="M2 2l12 12" />}
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                      <button
                        className="btn"
                        disabled={apiStatus === "loading"}
                        onClick={async () => {
                          if (apiKey.length > 3 || provider === "custom") {
                            setApiStatus("loading");
                            setVerifiedModel("");
                            try {
                              const models: any = await invoke("fetch_models", { provider, apiKey, customUrl: customUrl || null });
                              setApiModels(models);
                              setApiStatus("success");
                              
                              let finalModel = selectedModel;
                              if (models.length > 0 && !models.find((m: any) => m.id === finalModel)) {
                                finalModel = models[0].id;
                                setSelectedModel(finalModel);
                              }
                              if (finalModel) setVerifiedModel(finalModel);

                              localStorage.setItem(
                                "pet_ai_settings",
                                JSON.stringify({ provider, key: apiKey, model: finalModel, customUrl })
                              );
                            } catch (err: any) {
                              setApiStatus("error");
                              setApiErrorMsg(err.toString());
                              setVerifiedModel("");
                            }
                          } else {
                            alert(t.enterApiKey);
                          }
                        }}
                      >
                        {apiStatus === "loading" ? "..." : t.verifyAndSave}
                      </button>
                    </div>

                    {verifiedModel && apiModels.length > 0 && (
                      <div className="setting-row">
                        <label>{t.selectModel}</label>
                        <div className="custom-select" onClick={(e) => e.stopPropagation()}>
                          <div
                            className="cs-trigger"
                            onClick={() => setShowModelDropdown(!showModelDropdown)}
                          >
                            <span className="cs-trigger-label">{selectedModel}</span>
                            <svg className="cs-chevron" viewBox="0 0 12 12" width="10" height="10">
                              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            </svg>
                          </div>
                          {showModelDropdown && (
                            <div className="cs-dropdown">
                              <input
                                type="text"
                                className="cs-dropdown-search"
                                placeholder={t.searchModel}
                                value={modelSearch}
                                onChange={(e) => setModelSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {apiModels
                                .filter((m) => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.id.toLowerCase().includes(modelSearch.toLowerCase()))
                                .map((m) => (
                                  <div
                                    key={m.id}
                                    className={`cs-item ${selectedModel === m.id ? "active" : ""}`}
                                    onClick={() => {
                                      setSelectedModel(m.id);
                                      setVerifiedModel(m.id);
                                      setShowModelDropdown(false);
                                      localStorage.setItem(
                                        "pet_ai_settings",
                                        JSON.stringify({ provider, key: apiKey, model: m.id, customUrl })
                                      );
                                    }}
                                  >
                                    {m.name}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {apiStatus === "success" && (
                      <div className="setting-row" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", flexShrink: 0, boxShadow: "0 0 8px rgba(74,222,128,0.6)" }}></span>
                          <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: "600", textShadow: "0 0 10px rgba(74,222,128,0.3)" }}>{t.apiConnected}</span>
                        </div>
                      </div>
                    )}
                    {apiStatus === "error" && (
                      <div className="setting-row" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginTop: "8px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f87171", flexShrink: 0, boxShadow: "0 0 8px rgba(248,113,113,0.6)" }}></span>
                            <span style={{ color: "#f87171", fontSize: "12px", fontWeight: "600", textShadow: "0 0 10px rgba(248,113,113,0.3)" }}>{t.apiError}</span>
                          </div>
                          <span style={{ color: "var(--fg-dim)", fontSize: "11px", wordBreak: "break-word" }}>{apiErrorMsg}</span>
                        </div>
                      </div>
                    )}

                    {/* Custom System Instruction (System Prompt) */}
                    <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
                      <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--fg)", marginBottom: "6px", display: "block" }}>
                        {t.systemPromptLabel}
                      </label>
                      <textarea
                        className="input-field"
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          background: "var(--bg-3)",
                          color: "var(--fg)",
                          border: "1px solid var(--line)",
                          fontSize: "11.5px",
                          fontFamily: "inherit",
                          resize: "vertical",
                          outline: "none"
                        }}
                        value={systemPrompt}
                        placeholder={t.systemPromptPlaceholder}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSystemPrompt(val);
                          localStorage.setItem("system_prompt", val);
                        }}
                      />
                    </div>

                    <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px", borderTop: "1px solid var(--line)", paddingTop: "14px", marginTop: "14px" }}>
                      <label className="toggle-row" style={{ width: "100%" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600" }}>{t.elevenLabsTts}</span>
                        <span
                          className={`toggle-switch ${elevenLabsEnabled ? "on" : ""}`}
                          onClick={() => {
                            const val = !elevenLabsEnabled;
                            setElevenLabsEnabled(val);
                            localStorage.setItem("elevenlabs_settings", JSON.stringify({ enabled: val, key: elevenLabsKey, voice: elevenLabsVoice }));
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>

                      {elevenLabsEnabled && (
                        <div style={{ width: "100%", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div>
                            <label style={{ fontSize: "11px", color: "var(--fg-dim)", marginBottom: "4px", display: "block" }}>{t.elevenLabsKey}</label>
                            <input
                              type="password"
                              className="input-field"
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "var(--bg-3)", color: "var(--fg)", border: "1px solid var(--line)" }}
                              value={elevenLabsKey}
                              placeholder="sk_..."
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "11px", color: "var(--fg-dim)", marginBottom: "4px", display: "block" }}>{t.elevenLabsVoice}</label>
                            <input
                              type="text"
                              className="input-field"
                              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "var(--bg-3)", color: "var(--fg)", border: "1px solid var(--line)" }}
                              value={elevenLabsVoice}
                              onChange={(e) => {
                                const val = e.target.value;
                                setElevenLabsVoice(val);
                                localStorage.setItem("elevenlabs_settings", JSON.stringify({ enabled: elevenLabsEnabled, key: elevenLabsKey, voice: val }));
                              }}
                              placeholder="Voice ID..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "tab-main-settings" && (
                <section className="tab-content active">
                  <h2>{t.settings}</h2>
                  <div className="card elevation-2">
                    <div className="setting-row" style={{ display: matchesSearch(t.language, "language", "язык", "english", "русский") ? "flex" : "none" }}>
                      <label>{t.language}</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className={`btn ${lang === "en" ? "active" : ""}`}
                          style={{ padding: "4px 12px", fontSize: "12px", background: lang === "en" ? "var(--accent)" : "var(--bg-3)" }}
                          onClick={() => {
                            setLang("en");
                            localStorage.setItem("app_lang", "en");
                          }}
                        >
                          English (EN)
                        </button>
                        <button
                          className={`btn ${lang === "ru" ? "active" : ""}`}
                          style={{ padding: "4px 12px", fontSize: "12px", background: lang === "ru" ? "var(--accent)" : "var(--bg-3)" }}
                          onClick={() => {
                            setLang("ru");
                            localStorage.setItem("app_lang", "ru");
                          }}
                        >
                          Русский (RU)
                        </button>
                      </div>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.autoLaunch, "autolaunch", "startup", "автозапуск", "виндовс") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.autoLaunch}</span>
                        <span
                          className={`toggle-switch ${autoLaunch ? "on" : ""}`}
                          onClick={() => {
                            const val = !autoLaunch;
                            setAutoLaunch(val);
                            localStorage.setItem("auto_launch", val ? "1" : "0");
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.alwaysOnTop, "top", "поверх", "окон") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.alwaysOnTop}</span>
                        <span
                          className={`toggle-switch ${alwaysOnTop ? "on" : ""}`}
                          onClick={async () => {
                            const val = !alwaysOnTop;
                            setAlwaysOnTop(val);
                            localStorage.setItem("always_on_top", val ? "1" : "0");
                            await invoke("set_always_on_top", { value: val });
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.particles, "particles", "частицы", "эффект") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.particles}</span>
                        <span
                          className={`toggle-switch ${particlesEnabled ? "on" : ""}`}
                          onClick={() => {
                            const val = !particlesEnabled;
                            setParticlesEnabled(val);
                            localStorage.setItem("particles_enabled", val ? "1" : "0");
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.letters, "letters", "буквы", "печать") ? "flex" : "none" }}>
                      <label className="toggle-row">
                        <span>{t.letters}</span>
                        <span
                          className={`toggle-switch ${floatLettersEnabled ? "on" : ""}`}
                          onClick={() => {
                            const val = !floatLettersEnabled;
                            setFloatLettersEnabled(val);
                            localStorage.setItem("float_letters", val ? "1" : "0");
                          }}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.fontSize, "font", "шрифт", "размер") ? "flex" : "none" }}>
                      <label>{t.fontSize}</label>
                      <div className="setting-control">
                        <input
                          type="range"
                          min="10"
                          max="18"
                          step="1"
                          value={fontSize}
                          onWheel={(e) => handleSliderWheel(e, fontSize, 10, 18, 1, setFontSize, "font_size")}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            setFontSize(v);
                            localStorage.setItem("font_size", v.toString());
                          }}
                        />
                        <span className="range-val">{fontSize}px</span>
                      </div>
                    </div>

                    <div className="setting-row" style={{ display: matchesSearch(t.accentColor, "accent", "color", "цвет") ? "flex" : "none" }}>
                      <label>{t.accentColor}</label>
                      <div className="color-picker-row">
                        <div className="color-swatches">
                          {["#FF8A8A", "#FFB882", "#FFE082", "#C5E099", "#8FDBA8", "#8FD6E0", "#8AB8FF", "#B8A8FF", "#FFA8D8"].map((c) => (
                            <button
                              key={c}
                              className={`color-swatch ${accentColor === c ? "active" : ""}`}
                              style={{ background: c }}
                              onClick={() => {
                                setAccentColor(c);
                                localStorage.setItem("accent_color", c);
                              }}
                            />
                          ))}
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => {
                              setAccentColor(e.target.value);
                              localStorage.setItem("accent_color", e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="setting-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "6px", display: matchesSearch(t.proxy, "proxy", "прокси") ? "flex" : "none" }}>
                      <label className="toggle-row" style={{ width: "100%" }}>
                        <span>{t.proxy}</span>
                        <span
                          className={`toggle-switch ${proxyEnabled ? "on" : ""}`}
                          onClick={() => setProxyEnabled(!proxyEnabled)}
                        >
                          <span className="toggle-slider"></span>
                        </span>
                      </label>

                      {proxyEnabled && (
                        <div id="proxy-details" style={{ display: "flex", flexDirection: "column", gap: "5px", paddingTop: "4px" }}>
                          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                            <div className="custom-select" style={{ flex: "0 0 90px" }} onClick={(e) => e.stopPropagation()}>
                              <div
                                className="cs-trigger"
                                style={{ padding: "3px 6px", fontSize: "11px" }}
                                onClick={() => setShowProxyProtoDropdown(!showProxyProtoDropdown)}
                              >
                                <span className="cs-trigger-label" style={{ fontSize: "11px" }}>
                                  {proxyProtocol.toUpperCase()}
                                </span>
                                <svg className="cs-chevron" viewBox="0 0 12 12" width="8" height="8">
                                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                </svg>
                              </div>
                              {showProxyProtoDropdown && (
                                <div className="cs-dropdown">
                                  {["http", "https", "socks5"].map((p) => (
                                    <div
                                      key={p}
                                      className={`cs-item ${proxyProtocol === p ? "active" : ""}`}
                                      onClick={() => {
                                        setProxyProtocol(p);
                                        setShowProxyProtoDropdown(false);
                                      }}
                                    >
                                      {p.toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <input
                              type="text"
                              placeholder="Хост"
                              value={proxyHost}
                              onChange={(e) => setProxyHost(e.target.value)}
                              style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", padding: "4px 6px", fontSize: "11px", color: "var(--fg)" }}
                            />
                            <input
                              type="number"
                              placeholder="Порт"
                              value={proxyPort}
                              onChange={(e) => setProxyPort(e.target.value)}
                              style={{ flex: "0 0 70px", background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", padding: "4px 6px", fontSize: "11px", color: "var(--fg)" }}
                            />
                          </div>

                          <div style={{ display: "flex", gap: "4px" }}>
                            <input
                              type="text"
                              placeholder="Логин (опц.)"
                              value={proxyUser}
                              onChange={(e) => setProxyUser(e.target.value)}
                              style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", padding: "4px 6px", fontSize: "11px", color: "var(--fg)" }}
                            />
                            <input
                              type="password"
                              placeholder="Пароль (опц.)"
                              value={proxyPass}
                              onChange={(e) => setProxyPass(e.target.value)}
                              style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: "var(--radius-sm)", padding: "4px 6px", fontSize: "11px", color: "var(--fg)" }}
                            />
                          </div>

                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <button className="btn" onClick={testProxyConfig} style={{ fontSize: "11px", padding: "3px 10px" }}>
                              Тест
                            </button>
                            <span style={{ fontSize: "10px", color: "var(--fg-dim)" }}>{proxyStatus}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      className="btn"
                      id="reset-settings-btn"
                      style={{ marginTop: "8px" }}
                      onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                    >
                      Сбросить все настройки
                    </button>
                  </div>
                </section>
              )}
            </main>
          </div>
        </div>
      )}

      {/* ── Pet Mode ── */}
      {view === "pet" && (
        <div id="pet-mode" style={{ display: "block" }}>
          <div id="pet-mode-inner">
            <div
              id="pet-container"
              className={`state-${petState} idle-var-${idleVariant} sleep-var-${sleepVariant} chew-var-${chewVariant} walk-var-${walkVariant} ${isDragging ? "dragging" : ""}`}
              style={{ opacity: petOpacity }}
              onPointerDown={handlePetPointerDown}
              onContextMenu={handlePetContextMenu}
            >
              {thoughtBubbleText && (
                <div id="thought-bubble" className={wanderPosRef.current && screenInfoRef.current && wanderPosRef.current.x > screenInfoRef.current.width - 380 ? "side-left" : "side-right"}>
                  <span id="thought-text">{thoughtBubbleText}</span>
                </div>
              )}



              {/* Float container for particles & typing letters */}
              <div id="float-text-container">
                {particles.map((p) => (
                  <div
                    key={p.id}
                    className="particle"
                    style={{
                      left: `${p.left}px`,
                      color: p.color,
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      display: "inline-block",
                      bottom: "45%",
                    }}
                  >
                    {PARTICLE_ICONS[p.icon] || PARTICLE_ICONS.sparkle}
                  </div>
                ))}
                {floatLetters.map((l) => (
                  <div key={l.id} className="float-letter" style={{ left: `${l.left}px` }}>
                    {l.char}
                  </div>
                ))}
              </div>

              {/* Pet SVG with smooth eye movement & Paw wave */}
              <svg id="pet-svg" viewBox="0 0 220 240">
                <defs>
                  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.12" />
                  </filter>
                </defs>

                {(() => {
                  const activeColor = petState === "annoyed" ? "#ff2222" : petColor;
                  return (
                    <>
                      {/* Legs */}
                      <g id="legs" className="legs-part">
                        <rect id="leg-bl" x="58" y="180" width="14" height="22" fill={activeColor} />
                        <rect id="leg-fl" x="80" y="180" width="14" height="22" fill={activeColor} />
                        <rect id="leg-br" x="128" y="180" width="14" height="22" fill={activeColor} />
                        <rect id="leg-fr" x="150" y="180" width="14" height="22" fill={activeColor} />
                      </g>

                      <g id="body" className="body-part">
                        <rect x="45" y="100" width="130" height="90" rx="0" fill={activeColor} filter="url(#shadow)" />
                        <rect x="55" y="110" width="110" height="60" rx="0" fill={activeColor} opacity="0.25" />
                      </g>

                      <g id="head" className="head-part">
                        {/* Eye Group Priority */}
                        {isDragging ? (
                          <g id="grab-eyes">
                            <polyline points="78,137 98,145 78,153" stroke="#1A1A1A" strokeWidth="5" fill="none" />
                            <polyline points="144,137 124,145 144,153" stroke="#1A1A1A" strokeWidth="5" fill="none" />
                          </g>
                        ) : petState === "sleep" ? (
                          <g id="sleep-eyes">
                            <rect x="76" y="143" width="24" height="3" fill="#1A1A1A" transform="rotate(-3, 88, 144.5)" />
                            <rect x="122" y="143" width="24" height="3" fill="#1A1A1A" transform="rotate(3, 134, 144.5)" />
                          </g>
                        ) : petState === "happy" || chewing ? (
                          <g id="happy-eyes">
                            <polyline points="82,147 88,139 94,147" stroke="#1A1A1A" strokeWidth="4" fill="none" />
                            <polyline points="128,147 134,139 140,147" stroke="#1A1A1A" strokeWidth="4" fill="none" />
                          </g>
                        ) : petState === "nihma" ? (
                          <g id="nihma-eyes">
                            {/* Super crazy misaligned googly eyes! */}
                            <circle cx="65" cy="115" r="18" fill="#fff" stroke="#1A1A1A" strokeWidth="4" />
                            <circle cx="60" cy="110" r="7" fill="#1A1A1A" />
                            <circle cx="155" cy="165" r="22" fill="#fff" stroke="#1A1A1A" strokeWidth="4" />
                            <circle cx="160" cy="170" r="9" fill="#ff0055" />
                          </g>
                        ) : petState === "annoyed" ? (
                          <g id="annoyed-eyes">
                            {/* Furious slant eyes >:( */}
                            <polygon points="70,136 100,146 70,150" fill="#1A1A1A" />
                            <polygon points="150,136 120,146 150,150" fill="#1A1A1A" />
                            <line x1="66" y1="128" x2="104" y2="140" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
                            <line x1="154" y1="128" x2="116" y2="140" stroke="#1A1A1A" strokeWidth="6" strokeLinecap="round" />
                          </g>
                        ) : isBlinking ? (
                          <g id="blink-eyes">
                            <rect x={EYE_BASES.left.x + eyeOffset.x} y={EYE_BASES.left.y + eyeOffset.y + 8} width="30" height="3" fill="#1A1A1A" />
                            <rect x={EYE_BASES.right.x + eyeOffset.x} y={EYE_BASES.right.y + eyeOffset.y + 8} width="30" height="3" fill="#1A1A1A" />
                          </g>
                        ) : (
                          <g className="eye-group">
                            <rect x={EYE_BASES.left.x + eyeOffset.x} y={EYE_BASES.left.y + eyeOffset.y} width="30" height="20" fill="#1A1A1A" />
                            <rect x={EYE_BASES.right.x + eyeOffset.x} y={EYE_BASES.right.y + eyeOffset.y} width="30" height="20" fill="#1A1A1A" />
                          </g>
                        )}

                        {/* Angry teeth mouth when annoyed */}
                        {petState === "annoyed" && (
                          <g id="angry-mouth">
                            <path d="M 88 162 L 132 162 L 126 172 L 110 164 L 94 172 Z" fill="#ffffff" stroke="#1A1A1A" strokeWidth="3.5" strokeLinejoin="round" />
                          </g>
                        )}

                        {/* Derpy giant mouth with tongue for Nihma */}
                        {petState === "nihma" && (
                          <g id="nihma-mouth">
                            <path d="M 65 150 Q 110 200, 155 150 Z" fill="#1A1A1A" />
                            <path d="M 95 165 Q 110 195, 125 165 Z" fill="#ff2266" />
                            <rect x="85" y="150" width="12" height="14" fill="#fff" rx="2" />
                            <rect x="123" y="150" width="12" height="14" fill="#fff" rx="2" />
                          </g>
                        )}

                  {chewing && (
                    <g id="mouth" style={{ opacity: 1 }}>
                      <path
                        d={chewOpen ? "M 100 165 Q 110 178, 120 165" : "M 100 164 Q 110 168, 120 164"}
                        stroke="#1A1A1A"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="square"
                      />
                    </g>
                  )}
                </g>

                <g id="left-paw" className="paw left-paw" transform={leftPawTransform}>
                  <rect x="25" y="132" width="20" height="20" fill={activeColor} />
                </g>
                <g id="right-paw" className="paw right-paw">
                  <rect x="175" y="132" width="20" height="20" fill={activeColor} />
                </g>
              </>
            );
          })()}
        </svg>

              {/* ── Radial Menu (Dynamic circular positioning like Electron) ── */}
              {showRadialMenu && (() => {
                const svgSleep = (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 11.5A6 6 0 1 1 8.5 5a5 5 0 0 0 6.5 6.5z" />
                    <text x="13" y="6" fontSize="5" fill="currentColor" stroke="none" fontWeight="bold">z</text>
                  </svg>
                );
                const svgFeed = (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="10" r="7" />
                    <circle cx="7.5" cy="8" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="9" cy="12" r="0.9" fill="currentColor" stroke="none" />
                    <circle cx="12.5" cy="11.5" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                );
                const svgWalkOn = (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="10" cy="4" r="2" />
                    <path d="M8 8l2 3 2-3M10 11v4M8 18l2-3 2 3" />
                    <path d="M6 10h3M11 10h3" />
                  </svg>
                );
                const svgWalkOff = (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="7" width="10" height="7" rx="1.5" />
                    <line x1="10" y1="7" x2="10" y2="14" />
                    <circle cx="10" cy="4.5" r="1.5" />
                  </svg>
                );
                const svgAsk = (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10a7 7 0 1 1 3.5 6.1L3 17l.9-3.5A7 7 0 0 1 3 10z" />
                    <line x1="7" y1="9" x2="13" y2="9" />
                    <line x1="7" y1="12" x2="11" y2="12" />
                  </svg>
                );


                const buttons: { key: string; title: string; icon: React.ReactNode; onClick: () => void; active?: boolean }[] = [
                  {
                    key: "sleep",
                    title: petState === "sleep" ? t.wakeUp : t.sleep,
                    icon: svgSleep,
                    onClick: () => { setPetState(prev => prev === "sleep" ? "idle" : "sleep"); setShowRadialMenu(false); },
                  },
                  {
                    key: "feed",
                    title: t.feed,
                    icon: svgFeed,
                    onClick: () => { handleFeed(); setShowRadialMenu(false); },
                  },
                  {
                    key: "walk",
                    title: autoWalk ? t.stop : t.walk,
                    icon: autoWalk ? svgWalkOff : svgWalkOn,
                    onClick: () => {
                      const next = !autoWalk;
                      setAutoWalk(next);
                      localStorage.setItem("pet_wander", next ? "1" : "0");
                      setShowRadialMenu(false);
                    },
                    active: autoWalk,
                  },
                  {
                    key: "settings",
                    title: t.settings,
                    icon: (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    ),
                    onClick: () => { handleOpenLauncher(); setShowRadialMenu(false); },
                  },
                ];
                if (verifiedModel) {
                  buttons.splice(2, 0, {
                    key: "ask",
                    title: t.askAi,
                    icon: svgAsk,
                    onClick: () => { setShowAskInput(true); setShowRadialMenu(false); },
                  });
                }

                const count = buttons.length;
                const radius = 72;
                const startAngle = -90;
                // Pet container width is 187px, so horizontal center cx = 93.5px. Pet body vertical center cy = 102px.
                const cx = 93.5;
                const cy = 102;

                // Feed timer calculation (feedTimerTick forces re-render every second)
                void feedTimerTick;
                let feedTimerText: string | null = null;
                if (lastFeedTime) {
                  const elapsed = Date.now() - lastFeedTime;
                  const remaining = 900000 - elapsed;
                  if (remaining > 0) {
                    const fm = Math.floor(remaining / 60000);
                    const fs = Math.ceil((remaining % 60000) / 1000);
                    feedTimerText = fm > 0 ? (lang === "ru" ? `${fm}м ${fs}с` : `${fm}m ${fs}s`) : (lang === "ru" ? `${fs}с` : `${fs}s`);
                  }
                }
                // Find feed button position
                const feedIdx = buttons.findIndex(b => b.key === "feed");
                const feedAngle = startAngle + (360 / count) * feedIdx;
                const feedRad = (feedAngle * Math.PI) / 180;
                const feedLeft = cx + radius * Math.cos(feedRad);
                const feedTop = cy + radius * Math.sin(feedRad);

                return (
                  <div id="radial-menu" className="visible" onPointerDown={(e) => e.stopPropagation()}>
                    {buttons.map((btn, i) => {
                      const angle = startAngle + (360 / count) * i;
                      const rad = (angle * Math.PI) / 180;
                      const left = cx + radius * Math.cos(rad);
                      const top = cy + radius * Math.sin(rad);
                      return (
                        <button
                          key={btn.key}
                          className={`radial-btn${btn.active ? " active" : ""}`}
                          style={{ left: `${left}px`, top: `${top}px`, transitionDelay: `${i * 0.035}s` }}
                          onClick={btn.onClick}
                          title={btn.title}
                        >
                          {btn.icon}
                        </button>
                      );
                    })}
                    {feedTimerText && (
                      <div id="feed-timer" style={{ left: `${feedLeft}px`, top: `${feedTop + 22}px` }}>
                        {feedTimerText}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Cookie fly animation */}
              {showCookieFly && <div className="cookie-fly">🍪</div>}

              {/* AI Input (Enter to send, instantly disappears on send) */}
              {showAskInput && (
                <div
                  id="ask-input-container"
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "185px",
                    display: "flex",
                    zIndex: 100,
                    pointerEvents: "auto"
                  }}
                >
                  <input
                    type="text"
                    id="ask-input"
                    disabled={isAsking}
                    placeholder={lang === "ru" ? "Спроси AI... (Enter)" : "Ask AI... (Enter)"}
                    value={askQuery}
                    onChange={(e) => {
                      setAskQuery(e.target.value);
                      resetAskInputTimer();
                    }}
                    onKeyDown={(e) => e.key === "Enter" && !isAsking && handleSendAsk()}
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      fontSize: "11px",
                      borderRadius: "18px",
                      border: "1px solid rgba(254,128,25,0.6)",
                      background: "rgba(29,32,33,0.96)",
                      color: "#fbf1c7",
                      outline: "none",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                      pointerEvents: "auto",
                      textAlign: "center"
                    }}
                  />
                </div>
              )}



              {/* XP Bar (Appears when feeding/gaining XP, smoothly hides after 3.5s) */}
              <div
                id="xp-bar-container"
                style={{
                  position: "absolute",
                  bottom: "-18px",
                  left: "10px",
                  right: "10px",
                  opacity: showXpBar ? 1 : 0,
                  pointerEvents: "none",
                  transition: "opacity 0.4s ease, transform 0.4s ease",
                  transform: showXpBar ? "translateY(0)" : "translateY(4px)",
                }}
              >
                {floatXpText && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-42px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontFamily: "Segoe UI Variable, Segoe UI, sans-serif",
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#4ade80",
                      textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                      zIndex: 35,
                      pointerEvents: "none",
                      animation: "xp-float 1.4s ease-out forwards",
                    }}
                  >
                    {floatXpText}
                  </div>
                )}
                <div id="xp-bar" style={{ height: "5px", background: "rgba(0,0,0,0.4)", borderRadius: "3px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div id="xp-bar-fill" style={{ width: `${Math.min(100, (xp / xpForNextLevel) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #fe8019, #4ade80)", transition: "width 0.3s ease" }}></div>
                </div>
                <span id="xp-bar-text" style={{ fontSize: "9px", fontWeight: 600, color: "#fbf1c7", display: "block", textAlign: "center", marginTop: "2px", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {lang === "ru" ? "Ур." : "Lvl."} {level} ({xp}/{xpForNextLevel})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
