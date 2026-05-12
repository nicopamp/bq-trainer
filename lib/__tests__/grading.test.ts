import { describe, it, expect } from "vitest";
import { gradeTypeOut, gradeVoice } from "@/lib/grading";

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
