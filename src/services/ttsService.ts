export const ttsService = {
  speak(text: string): void {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.2;
      const voices = window.speechSynthesis.getVoices();
      const ruVoice = voices.find(v => v.lang.startsWith('ru'));
      if (ruVoice) utterance.voice = ruVoice;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('TTS speech error:', err);
    }
  },

  stop(): void {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
  },
};
