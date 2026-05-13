import type { VerseState } from "./supabase/types";
import type { UserVerseStateRow } from "./supabase/queries";
import { extractVerse } from "./supabase/queries";
import { isVerseReady } from "./events";

export interface VerseStateMap {
  [chapter: number]: { [verse: number]: VerseState };
}

export interface VerseProgress {
  verseMap: VerseStateMap;
  dueCount: number;
  masteredCount: number;
}

/** Build a chapter→verse→state map and derive session-relevant counts from raw user verse rows. */
export function deriveVerseProgress(rows: UserVerseStateRow[], now = new Date()): VerseProgress {
  const verseMap: VerseStateMap = {};
  let dueCount = 0;
  let masteredCount = 0;

  for (const uv of rows) {
    const ref = extractVerse(uv.verses);
    const chapter = ref?.chapter;
    const verse = ref?.verse;
    if (!chapter || !verse) continue;
    if (!verseMap[chapter]) verseMap[chapter] = {};
    verseMap[chapter][verse] = uv.state;
    if (uv.due_at && new Date(uv.due_at) <= now && uv.state !== "new") dueCount++;
    if (isVerseReady(uv.state)) masteredCount++;
  }

  return { verseMap, dueCount, masteredCount };
}

const DRILL_MODE_SPLITS: Array<[string, number]> = [
  ["audio", 0.35],
  ["finish-it", 0.4],
  ["type out", 0.15],
  ["ref → verse", 0.1],
];

/** Allocate due verses across drill modes using the canonical session split. */
export function allocateDrillModes(dueCount: number): Array<[string, number]> {
  return DRILL_MODE_SPLITS
    .map(([mode, frac]): [string, number] => [mode, Math.ceil(dueCount * frac)])
    .filter(([, n]) => n > 0);
}

/** Find the first verse the user hasn't started learning, in chapter/verse order. */
export function findNextLearnVerse(
  verseMap: VerseStateMap,
  chapterCounts: Record<number, number>
): { chapter: number; verse: number } | null {
  const chapters = Object.keys(chapterCounts).map(Number).sort((a, b) => a - b);
  for (const ch of chapters) {
    for (let v = 1; v <= chapterCounts[ch]; v++) {
      if (!verseMap[ch]?.[v] || verseMap[ch][v] === "new") {
        return { chapter: ch, verse: v };
      }
    }
  }
  return null;
}

/** Percentage of this week's reviews graded Good or Easy. */
export function calculateRecallRate(weekReviews: { grade: number }[]): number {
  if (weekReviews.length === 0) return 0;
  const good = weekReviews.filter((r) => r.grade >= 3).length;
  return Math.round((good / weekReviews.length) * 100);
}
