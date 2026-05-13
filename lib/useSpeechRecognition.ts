import { useState, useRef, useCallback, useEffect } from "react";
import { createSRSession, type SRSession } from "@/lib/speechRecognitionSession";

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
  const sessionRef = useRef<SRSession | null>(null);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  onFinalRef.current = onFinal;
  onErrorRef.current = onError;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Stop mic when the component unmounts (e.g. user navigates away mid-session).
  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
    };
  }, []);

  const stopListening = useCallback(() => {
    sessionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // Lazily create the session once; reuse on every subsequent startListening call
    // to avoid browsers re-prompting for mic permission on each new SR instance.
    if (!sessionRef.current) {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      sessionRef.current = createSRSession(
        SR,
        { interimResults, lang },
        {
          onTranscript: (text) => setTranscript(text),
          onEnd: (finalText) => {
            setIsListening(false);
            if (finalText) onFinalRef.current?.(finalText);
          },
          onError: () => {
            setIsListening(false);
            onErrorRef.current?.();
          },
        }
      );
    }

    setTranscript("");
    setIsListening(true);
    sessionRef.current.start();
  }, [isSupported, interimResults, lang]);

  return { startListening, stopListening, transcript, isListening, isSupported };
}
