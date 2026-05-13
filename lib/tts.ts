/** A minimal interface for a single audio output channel. One adapter plays at a time. */
export interface Speaker {
  speak(text: string, onEnd?: () => void): void;
  stop(): void;
}

const PREFERRED_VOICES = [
  "Google US English",
  "Google UK English Female",
  "Samantha (Premium)",
  "Ava (Premium)",
  "Nicky (Premium)",
  "Samantha (Enhanced)",
  "Ava (Enhanced)",
  "Nicky (Enhanced)",
  "Samantha",
  "Karen",
  "Moira",
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

// ── TTSSpeaker — browser SpeechSynthesis adapter ──────────────────

class TTSSpeaker implements Speaker {
  private rate: number;

  constructor(rate = 0.82) {
    this.rate = rate;
  }

  speak(text: string, onEnd?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const say = (voices: SpeechSynthesisVoice[]) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = this.rate;
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
      setTimeout(() => { if (!spoken) { spoken = true; say([]); } }, 500);
    }
  }

  stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// ── VerseSpeaker — prerecorded audio adapter, falls back to TTS ───

class VerseSpeaker implements Speaker {
  private chapter: number;
  private verse: number;
  private tts: TTSSpeaker;
  private audio: HTMLAudioElement | null = null;

  constructor(chapter: number, verse: number, ttsRate = 0.82) {
    this.chapter = chapter;
    this.verse = verse;
    this.tts = new TTSSpeaker(ttsRate);
  }

  speak(text: string, onEnd?: () => void): void {
    if (typeof window === "undefined") return;
    const url = `/audio/acts_${this.chapter}_${this.verse}.mp3`;
    const audio = new Audio(url);
    this.audio = audio;
    audio.onended = () => { this.audio = null; onEnd?.(); };
    audio.onerror = () => { this.audio = null; this.tts.speak(text, onEnd); };
    audio.play().catch(() => { this.audio = null; this.tts.speak(text, onEnd); });
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    this.tts.stop();
  }
}

// ── Module-level API — one active speaker at a time ───────────────

let activeSpeaker: Speaker | null = null;

export function stopSpeaking(): void {
  activeSpeaker?.stop();
  activeSpeaker = null;
}

export function speakText(text: string, rate = 0.82, onEnd?: () => void): void {
  stopSpeaking();
  const speaker = new TTSSpeaker(rate);
  activeSpeaker = speaker;
  speaker.speak(text, () => { activeSpeaker = null; onEnd?.(); });
}

export function speakVerse(chapter: number, verse: number, text: string, onEnd?: () => void): void {
  stopSpeaking();
  const speaker = new VerseSpeaker(chapter, verse);
  activeSpeaker = speaker;
  speaker.speak(text, () => { activeSpeaker = null; onEnd?.(); });
}
