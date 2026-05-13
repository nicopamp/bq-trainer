import { describe, it, expect } from "vitest";
import { allocateDrillModes, findNextLearnVerse, deriveVerseProgress } from "@/lib/home";
import type { UserVerseStateRow } from "@/lib/supabase/queries";
import type { VerseState } from "@/lib/supabase/types";

function row(
  chapter: number,
  verse: number,
  state: VerseState,
  due_at: string | null = null
): UserVerseStateRow {
  return { verse_id: chapter * 100 + verse, state, due_at, verses: { chapter, verse } };
}

describe("allocateDrillModes", () => {
  it("returns empty array for 0 due verses", () => {
    expect(allocateDrillModes(0)).toEqual([]);
  });

  it("returns all four modes with positive counts that sum to at least dueCount", () => {
    const result = allocateDrillModes(10);
    const modes = result.map(([mode]) => mode);
    expect(modes).toContain("audio");
    expect(modes).toContain("finish-it");
    expect(modes).toContain("type out");
    expect(modes).toContain("ref → verse");
    result.forEach(([, n]) => expect(n).toBeGreaterThan(0));
    const total = result.reduce((sum, [, n]) => sum + n, 0);
    expect(total).toBeGreaterThanOrEqual(10);
  });
});

describe("findNextLearnVerse", () => {
  it("skips a fully-learned chapter and returns first verse of next chapter", () => {
    const verseMap = {
      1: { 1: "mastered" as VerseState, 2: "review" as VerseState, 3: "learning" as VerseState },
      2: {},
    };
    expect(findNextLearnVerse(verseMap, { 1: 3, 2: 3 })).toEqual({ chapter: 2, verse: 1 });
  });

  it("returns null when all verses are mastered", () => {
    const verseMap = { 1: { 1: "mastered" as VerseState, 2: "mastered" as VerseState } };
    expect(findNextLearnVerse(verseMap, { 1: 2 })).toBeNull();
  });
});

describe("deriveVerseProgress", () => {
  it("counts dueCount and masteredCount correctly from mixed-state rows", () => {
    const past = "2020-01-01T00:00:00Z";
    const future = "2099-01-01T00:00:00Z";
    const now = new Date("2025-01-01T00:00:00Z");
    const rows: UserVerseStateRow[] = [
      row(1, 1, "mastered", past),  // due + mastered (review or mastered = ready)
      row(1, 2, "review", past),    // due + mastered
      row(1, 3, "learning", past),  // due, not mastered
      row(1, 4, "new", past),       // state=new → NOT counted as due; not mastered
      row(1, 5, "mastered", future), // not yet due (future due_at); mastered
    ];
    const { dueCount, masteredCount } = deriveVerseProgress(rows, now);
    expect(dueCount).toBe(3);
    expect(masteredCount).toBe(3);
  });
});
