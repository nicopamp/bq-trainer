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
  const [isGrading, setIsGrading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const sessionRef = useRef<SRSession | null>(null);
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  onFinalRef.current = onFinal;
  onErrorRef.current = onError;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Destroy the cached session when recognition options change so the next
  // startListening call picks up the new config. Also destroys on unmount.
  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
      sessionRef.current = null;
    };
  }, [interimResults, lang]);

  const stopListening = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.stop();
    setIsListening(false);
    setIsGrading(true);
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
            setIsGrading(false);
            if (finalText) onFinalRef.current?.(finalText);
          },
          onError: () => {
            setIsListening(false);
            setIsGrading(false);
            onErrorRef.current?.();
          },
        }
      );
    }

    setTranscript("");
    setIsGrading(false);
    setIsListening(true);
    sessionRef.current.start();
  }, [isSupported, interimResults, lang]);

  return { startListening, stopListening, transcript, isListening, isGrading, isSupported };
}
