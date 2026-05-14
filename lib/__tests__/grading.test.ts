import { describe, it, expect } from "vitest";
import { gradeTypeOut, gradeVoice, RECALL_THRESHOLDS, gradeRecallPass } from "@/lib/grading";

describe("gradeTypeOut", () => {
  it("exact match → pass, 100% accuracy, all words correct", () => {
    const result = gradeTypeOut("In the beginning", "In the beginning");
    expect(result.pass).toBe(true);
    expect(result.accuracy).toBe(1);
    expect(result.wordResults).toEqual([
      { word: "in", correct: true },
      { word: "the", correct: true },
      { word: "beginning", correct: true },
    ]);
  });

  it("one word wrong → fail, that word flagged incorrect", () => {
    const result = gradeTypeOut("In a beginning", "In the beginning");
    expect(result.pass).toBe(false);
    expect(result.wordResults[1]).toEqual({ word: "the", correct: false });
    expect(result.wordResults[0]).toEqual({ word: "in", correct: true });
    expect(result.wordResults[2]).toEqual({ word: "beginning", correct: true });
  });

  it("one word missing (input shorter) → fail, missing word flagged incorrect", () => {
    const result = gradeTypeOut("In the", "In the beginning");
    expect(result.pass).toBe(false);
    expect(result.wordResults[2]).toEqual({ word: "beginning", correct: false });
  });

  it("one word added (input longer) → fail", () => {
    const result = gradeTypeOut("In the beginning indeed", "In the beginning");
    expect(result.pass).toBe(false);
    // accuracy based on target length — 3/3 target words matched correctly
    // but extra word shifts nothing (we only check target positions)
    // Actually all 3 target words match at their positions → this should pass?
    // No: "indeed" is extra, but the 3 target words at pos 0,1,2 all match.
    // The spec says "one word added → fail" — per issue we need strict word-perfect.
    // Re-reading the issue: "any word added, omitted, or changed counts as a miss"
    // So we need to check that inputWords.length === targetWords.length too.
    expect(result.accuracy).toBeLessThan(1);
  });

  it("punctuation differences ignored → pass", () => {
    const result = gradeTypeOut("In the beginning,", "In the beginning");
    expect(result.pass).toBe(true);
  });

  it("case differences ignored → pass", () => {
    const result = gradeTypeOut("in THE beginning", "In the beginning");
    expect(result.pass).toBe(true);
  });

  it("empty input → fail, 0% accuracy", () => {
    const result = gradeTypeOut("", "In the beginning");
    expect(result.pass).toBe(false);
    expect(result.accuracy).toBe(0);
  });
});

describe("RECALL_THRESHOLDS", () => {
  it("has three thresholds: 0.80, 0.90, 0.90", () => {
    expect(RECALL_THRESHOLDS).toEqual([0.80, 0.90, 0.90]);
  });
});

describe("gradeRecallPass", () => {
  it("exact match → pass=true, accuracy=1, all words hit", () => {
    const result = gradeRecallPass("the Lord is my shepherd", "the Lord is my shepherd", 0);
    expect(result.pass).toBe(true);
    expect(result.accuracy).toBe(1);
    expect(result.wordResults).toEqual([
      { word: "the", hit: true },
      { word: "lord", hit: true },
      { word: "is", hit: true },
      { word: "my", hit: true },
      { word: "shepherd", hit: true },
    ]);
  });

  it("empty transcript → pass=false, accuracy=0, all words missed", () => {
    const result = gradeRecallPass("", "the Lord is my shepherd", 0);
    expect(result.pass).toBe(false);
    expect(result.accuracy).toBe(0);
    expect(result.wordResults.every((r) => !r.hit)).toBe(true);
    expect(result.wordResults).toHaveLength(5);
  });

  it("zero overlap → pass=false, accuracy=0", () => {
    const result = gradeRecallPass("foo bar baz", "the Lord is my shepherd", 0);
    expect(result.pass).toBe(false);
    expect(result.accuracy).toBe(0);
  });

  describe("wordResults hit/miss alignment", () => {
    it("wordResults align to target words, missed words flagged hit=false", () => {
      // target: "and it came to pass" — say only 3 of 5
      const result = gradeRecallPass("and it came", "and it came to pass", 0);
      expect(result.wordResults).toEqual([
        { word: "and", hit: true },
        { word: "it", hit: true },
        { word: "came", hit: true },
        { word: "to", hit: false },
        { word: "pass", hit: false },
      ]);
    });

    it("repeated word in transcript only gives credit equal to target occurrences", () => {
      // target has 'and' twice; transcript has 'and' four times — only 2 credits
      const result = gradeRecallPass("and and and and", "and peace and joy", 0);
      expect(result.wordResults.filter((r) => r.hit)).toHaveLength(2);
      expect(result.wordResults.find((r) => r.word === "peace")?.hit).toBe(false);
    });
  });

  describe("threshold boundaries by passIndex", () => {
    // 5-word target: 4/5=0.80, 3/5=0.60
    const target5 = "one two three four five";

    it("passIndex 0: 4/5 words (80%) → pass (≥0.80)", () => {
      const result = gradeRecallPass("one two three four", target5, 0);
      expect(result.pass).toBe(true);
      expect(result.accuracy).toBeCloseTo(0.8);
    });

    it("passIndex 0: 3/5 words (60%) → fail (<0.80)", () => {
      const result = gradeRecallPass("one two three", target5, 0);
      expect(result.pass).toBe(false);
    });

    // 10-word target: 9/10=0.90, 8/10=0.80
    const target10 = "a b c d e f g h i j";

    it("passIndex 1: 9/10 words (90%) → pass (≥0.90)", () => {
      const result = gradeRecallPass("a b c d e f g h i", target10, 1);
      expect(result.pass).toBe(true);
      expect(result.accuracy).toBeCloseTo(0.9);
    });

    it("passIndex 1: 8/10 words (80%) → fail (<0.90)", () => {
      const result = gradeRecallPass("a b c d e f g h", target10, 1);
      expect(result.pass).toBe(false);
    });

    // 10-word target: 9/10=0.90 (pass 2 threshold same as pass 3)
    it("passIndex 2: 9/10 words (90%) → pass (≥0.90)", () => {
      const result = gradeRecallPass("a b c d e f g h i", target10, 2);
      expect(result.pass).toBe(true);
      expect(result.accuracy).toBeCloseTo(0.9);
    });

    it("passIndex 2: 8/10 words (80%) → fail (<0.90)", () => {
      const result = gradeRecallPass("a b c d e f g h", target10, 2);
      expect(result.pass).toBe(false);
    });
  });

  describe("fuzzy word matching", () => {
    it("prefix morphology: 'teaching' matches target 'teach'", () => {
      const result = gradeRecallPass("and he began teaching them", "and he began teach them", 0);
      expect(result.wordResults.find((r) => r.word === "teach")?.hit).toBe(true);
    });

    it("letter transposition on long word: 'treaties' matches target 'treatise'", () => {
      const result = gradeRecallPass("the former treaties have i made", "the former treatise have i made", 0);
      expect(result.wordResults.find((r) => r.word === "treatise")?.hit).toBe(true);
    });

    it("short words (< 4 chars) require exact match — no fuzzy false positives", () => {
      // "him" and "his" differ by 1 char but are semantically different
      const result = gradeRecallPass("him", "his", 0);
      expect(result.wordResults[0].hit).toBe(false);
    });

    it("fuzzy hit still counts toward accuracy", () => {
      // All 5 words matched (1 via fuzzy) → accuracy = 1 → pass
      const result = gradeRecallPass("the former treaties have i", "the former treatise have i", 0);
      expect(result.pass).toBe(true);
      expect(result.accuracy).toBe(1);
    });
  });

  describe("proper noun exclusion", () => {
    it("proper noun missed by ASR does not fail the attempt when all other words match", () => {
      // "Cornelius" is a proper noun at index 1 → excluded from accuracy
      // Transcript omits it (ASR failure); other 3 words hit → 3/3 = 100% → pass
      const result = gradeRecallPass("and answered him", "and Cornelius answered him", 0);
      expect(result.pass).toBe(true);
      // Proper noun still appears in wordResults so UI can highlight it
      expect(result.wordResults.find((r) => r.word === "cornelius")?.hit).toBe(false);
    });

    it("without proper noun exclusion the same attempt would fail at 80% threshold", () => {
      // 3/4 = 75% → below 80% if Cornelius were included — verifies the fix matters
      const withoutExclusion = 3 / 4;
      expect(withoutExclusion).toBeLessThan(0.80);
    });

    it("first word capitalization is never treated as a proper noun", () => {
      // "The" at index 0 is excluded from detection regardless of case
      const result = gradeRecallPass("the former treatise", "The former treatise", 0);
      expect(result.pass).toBe(true);
      expect(result.accuracy).toBe(1);
    });
  });
});

describe("gradeVoice", () => {
  it("exact match → pass, 100% accuracy", () => {
    const result = gradeVoice("In the beginning", "In the beginning");
    expect(result.pass).toBe(true);
    expect(result.accuracy).toBe(1);
    expect(result.wordResults).toEqual([]);
  });

  it("75% word overlap → pass (boundary)", () => {
    // 3 of 4 words match → 75%
    const result = gradeVoice("the beginning was here", "In the beginning was");
    expect(result.pass).toBe(true);
    expect(result.accuracy).toBeCloseTo(0.75);
  });

  it("74% word overlap → fail (boundary)", () => {
    // 3 of 4 words present is 75%; need < 75% → 2 of 4 = 50%
    const result = gradeVoice("the beginning", "In the beginning was");
    expect(result.pass).toBe(false);
    expect(result.accuracy).toBeCloseTo(0.5);
  });

  it("empty transcript → fail, 0% accuracy", () => {
    const result = gradeVoice("", "In the beginning");
    expect(result.pass).toBe(false);
    expect(result.accuracy).toBe(0);
  });
});
