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

/**
 * Per-pass accuracy thresholds for the Learn Flow Recall step (0-indexed).
 * Pass 3 is capped at 0.90 (not 0.95) because KJV archaic words (treatise,
 * saith, etc.) are reliably misheard by ASR even when spoken correctly.
 * Proper noun exclusion + fuzzy matching absorb most errors; 0.90 absorbs the rest.
 */
export const RECALL_THRESHOLDS = [0.80, 0.90, 0.90] as const;

export interface GradeResult {
  pass: boolean;
  accuracy: number;
  wordResults: Array<{ word: string; correct: boolean }>;
}

/** Word-perfect grading for TypeOut mode. Position-sensitive word-by-word comparison. */
export function gradeTypeOut(input: string, target: string): GradeResult {
  const targetWords = normalizeWords(target);
  const inputWords = normalizeWords(input);
  if (targetWords.length === 0) return { pass: true, accuracy: 1, wordResults: [] };
  const wordResults = targetWords.map((word, i) => ({
    word,
    correct: inputWords[i] === word,
  }));
  const correct = wordResults.filter((r) => r.correct).length;
  // Extra input words beyond target count against accuracy (strict word-perfect)
  const denominator = Math.max(targetWords.length, inputWords.length);
  const accuracy = correct / denominator;
  return { pass: accuracy === 1, accuracy, wordResults };
}

/** ASR-tolerant grading for voice modes. Bag-of-words overlap, passes at ≥ 0.75. */
export function gradeVoice(transcript: string, target: string): GradeResult {
  const accuracy = calculateWordOverlap(transcript, target);
  return { pass: accuracy >= ASR_PASS_THRESHOLD, accuracy, wordResults: [] };
}

export interface RecallPassResult {
  pass: boolean;
  accuracy: number;
  wordResults: Array<{ word: string; hit: boolean }>;
}

/** Standard Levenshtein edit distance. Returns Infinity when lengths differ by > 3 (fast reject). */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return Infinity;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]
        : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev.splice(0, b.length + 1, ...curr);
  }
  return curr[b.length];
}

/**
 * Fuzzy word match for ASR substitution errors on KJV text.
 * Handles: prefix/suffix morphology ("teaching" ↔ "teach"),
 * and letter transpositions on archaic words ("treaties" ↔ "treatise").
 * Short words (< 4 chars) use prefix-only matching to avoid false positives.
 */
function fuzzyWordMatch(said: string, target: string): boolean {
  if (said === target) return true;
  // One is a prefix of the other and the extension is ≤ 3 chars
  // (handles "teaching"→"teach", "maketh"→"make")
  if (said.startsWith(target) || target.startsWith(said)) {
    return Math.abs(said.length - target.length) <= 3;
  }
  const minLen = Math.min(said.length, target.length);
  if (minLen < 4) return false; // too short — avoid "him"↔"his" false match
  const maxDist = minLen >= 7 ? 2 : 1;
  return editDistance(said, target) <= maxDist;
}

/**
 * Returns the set of word indices (0-based) that are KJV proper nouns —
 * words capitalized mid-sentence (not the first word) with length > 1.
 * These are excluded from the accuracy denominator in gradeRecallPass because
 * ASR reliably fails to transcribe them (Theophilus, Cornelius, etc.).
 * They still appear in wordResults so the UI can show them as missed.
 */
function properNounIndices(target: string): Set<number> {
  const words = target.split(/\s+/).filter(Boolean);
  const indices = new Set<number>();
  for (let i = 1; i < words.length; i++) {
    const stripped = words[i].replace(/[^\w]/g, "");
    if (stripped.length > 1 && /^[A-Z]/.test(stripped)) indices.add(i);
  }
  return indices;
}

/**
 * Grade a single Recall step pass using bag-of-words normalization.
 * passIndex is 0-based; threshold comes from RECALL_THRESHOLDS[passIndex].
 * Proper nouns (capitalized mid-sentence, length > 1) are excluded from the
 * accuracy denominator — ASR cannot reliably transcribe KJV names.
 */
export function gradeRecallPass(transcript: string, target: string, passIndex: number): RecallPassResult {
  const targetWords = normalizeWords(target);
  if (targetWords.length === 0) return { pass: true, accuracy: 1, wordResults: [] };
  const saidWords = normalizeWords(transcript);
  const saidCounts = new Map<string, number>();
  for (const w of saidWords) saidCounts.set(w, (saidCounts.get(w) ?? 0) + 1);
  // Pass 1: exact bag-of-words matching
  const wordResults: Array<{ word: string; hit: boolean }> = targetWords.map((word) => {
    const count = saidCounts.get(word) ?? 0;
    if (count > 0) {
      saidCounts.set(word, count - 1);
      return { word, hit: true };
    }
    return { word, hit: false };
  });
  // Pass 2: fuzzy matching for missed target words (ASR substitution errors on KJV archaisms)
  for (let i = 0; i < wordResults.length; i++) {
    if (!wordResults[i].hit) {
      for (const [saidWord, cnt] of saidCounts) {
        if (cnt > 0 && fuzzyWordMatch(saidWord, wordResults[i].word)) {
          saidCounts.set(saidWord, cnt - 1);
          wordResults[i] = { word: wordResults[i].word, hit: true };
          break;
        }
      }
    }
  }
  const excluded = properNounIndices(target);
  const gradable = wordResults.filter((_, i) => !excluded.has(i));
  const accuracy = gradable.length > 0
    ? gradable.filter((r) => r.hit).length / gradable.length
    : 1;
  const threshold = RECALL_THRESHOLDS[passIndex] ?? RECALL_THRESHOLDS[RECALL_THRESHOLDS.length - 1];
  return { pass: accuracy >= threshold, accuracy, wordResults };
}