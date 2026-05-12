import { useState, useRef, useCallback } from "react";

interface Options {
  interimResults?: boolean;
  lang?: string;
  onFinal?: (transcript: string) => void;
  onError?: () => void;
}

export function useSpeechRecognition({
  interimResults = false,
  lang = "en-US",
  onFinal,
  onError,
}: Options = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<any>(null);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  onFinalRef.current = onFinal;
  onErrorRef.current = onError;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    recRef.current = rec;
    rec.continuous = false;
    rec.interimResults = interimResults;
    rec.lang = lang;

    setIsListening(true);
    setTranscript("");

    let finalText = "";

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setTranscript(finalText || interim);
    };

    rec.onend = () => {
      recRef.current = null;
      setIsListening(false);
      if (finalText) onFinalRef.current?.(finalText);
    };

    rec.onerror = () => {
      recRef.current = null;
      setIsListening(false);
      onErrorRef.current?.();
    };

    rec.start();
  }, [isSupported, interimResults, lang]);

  return { startListening, stopListening, transcript, isListening, isSupported };
}