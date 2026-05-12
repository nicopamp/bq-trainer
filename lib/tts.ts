const PREFERRED_VOICES = [
  "Google US English",
  "Google UK English Female",
  "Samantha (Premium)",   // iOS 17+ premium
  "Ava (Premium)",        // iOS 17+ premium
  "Nicky (Premium)",      // iOS 17+ premium
  "Samantha (Enhanced)",  // iOS enhanced
  "Ava (Enhanced)",       // iOS enhanced
  "Nicky (Enhanced)",     // iOS enhanced
  "Samantha",             // macOS / iOS standard
  "Karen",                // iOS/macOS
  "Moira",                // macOS
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of PREFERRED_VOICES) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }
  const google = voices.find((v) => v.name.startsWith("Google") && v.lang.startsWith("en"));
  if (google) return google;
  const enUS = voices.find((v) => v.lang === "en-US");
  if (enUS) return enUS;
  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(text: string, rate = 0.82, onEnd?: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  stopSpeaking();

  const say = (voices: SpeechSynthesisVoice[]) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    const voice = pickVoice(voices);
    if (voice) u.voice = voice;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    say(voices);
  } else {
    let spoken = false;
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (!spoken) { spoken = true; say(window.speechSynthesis.getVoices()); }
    };
    // Fallback for browsers that never fire onvoiceschanged
    setTimeout(() => {
      if (!spoken) { spoken = true; say([]); }
    }, 500);
  }
}

export function speakVerse(chapter: number, verse: number, text: string, onEnd?: () => void): void {
  if (typeof window === "undefined") return;
  stopSpeaking();

  const url = `/audio/acts_${chapter}_${verse}.mp3`;
  const audio = new Audio(url);
  currentAudio = audio;

  audio.onended = () => {
    currentAudio = null;
    onEnd?.();
  };

  audio.onerror = () => {
    currentAudio = null;
    // Pre-generated audio not available; fall back to browser TTS
    speakText(text, 0.82, onEnd);
  };

  audio.play().catch(() => {
    currentAudio = null;
    speakText(text, 0.82, onEnd);
  });
}
