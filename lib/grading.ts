/**
 * Grading utilities for drill modes.
 *
 * Voice modes use ASR Tolerance (word-overlap, lenient) per ADR-0001.
 * Type-out uses Word-Perfect (strict character match) — handled in DrillClient.
 */

function normalizeWords(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
}

/**
 * ASR Tolerance: fraction of target words present in the transcript.
 * Accounts for speech recognition errors on KJV archaisms, proper names, accents.
 * Each target word is counted at most once regardless of repetition in the transcript.
 */
export function calculateWordOverlap(transcript: string, target: string): number {
  const targetWords = normalizeWords(target);
  if (targetWords.length === 0) return 1;
  const saidWords = normalizeWords(transcript);
  const saidCounts = new Map<string, number>();
  for (const w of saidWords) saidCounts.set(w, (saidCounts.get(w) ?? 0) + 1);
  let matches = 0;
  for (const w of targetWords) {
    const count = saidCounts.get(w) ?? 0;
    if (count > 0) {
      matches++;
      saidCounts.set(w, count - 1);
    }
  }
  return matches / targetWords.length;
}

/** Auto-grade an ASR Tolerance result to a 1–4 FSRS rating. */
export function asrAccuracyToGrade(accuracy: number): 1 | 2 | 3 | 4 {
  return accuracy >= 0.9 ? 4 : accuracy >= 0.75 ? 3 : accuracy >= 0.5 ? 2 : 1;
}

/** Minimum word-overlap fraction for a Recall step pass. */
export const ASR_PASS_THRESHOLD = 0.75;