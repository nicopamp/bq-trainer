const PREFERRED_VOICES = [
  "Google US English",
  "Google UK English Female",
  "Samantha",  // macOS
  "Karen",     // iOS/macOS
  "Moira",     // macOS Irish English, often higher quality
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

export function speakText(text: string, rate = 0.85): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const say = (voices: SpeechSynthesisVoice[]) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    const voice = pickVoice(voices);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    say(voices);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      say(window.speechSynthesis.getVoices());
    };
  }
}
