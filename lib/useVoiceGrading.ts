import { useState } from "react";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { gradeVoice, asrAccuracyToGrade } from "@/lib/grading";
import type { GradeResult } from "@/lib/grading";

export interface VoiceGradingState {
  start: () => void;
  isListening: boolean;
  transcript: string;
  gradeResult: GradeResult | null;
  autoGrade: 1 | 2 | 3 | 4 | null;
  voiceUnavailable: boolean;
  showManualGrade: boolean;
}

interface Options {
  /** Called when speech recognition fails (network error, permission denied, etc.). */
  onError?: () => void;
}

/**
 * Wraps useSpeechRecognition + ASR Tolerance grading into one hook.
 * Use for all voice drill modes (Audio, Finish-it, Ref-to-verse).
 * Not for the Learn Flow Recall step, which uses gradeRecallPass directly.
 */
export function useVoiceGrading(target: string, options?: Options): VoiceGradingState {
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);

  const { startListening, transcript, isListening, isSupported } = useSpeechRecognition({
    onFinal: (said) => setGradeResult(gradeVoice(said, target)),
    onError: options?.onError,
  });

  const start = () => {
    if (!isSupported) { setVoiceUnavailable(true); return; }
    startListening();
  };

  const autoGrade = gradeResult !== null ? asrAccuracyToGrade(gradeResult.accuracy) : null;
  const showManualGrade = voiceUnavailable || gradeResult !== null;

  return { start, isListening, transcript, gradeResult, autoGrade, voiceUnavailable, showManualGrade };
}
