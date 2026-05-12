import { describe, it, expect } from "vitest";
import { calculateWordOverlap, asrAccuracyToGrade, ASR_PASS_THRESHOLD } from "./grading";

describe("calculateWordOverlap", () => {
  it("perfect transcript match returns 1.0", () => {
    expect(calculateWordOverlap("the Lord is my shepherd", "the Lord is my shepherd")).toBe(1);
  });

  it("no matching words returns 0.0", () => {
    expect(calculateWordOverlap("foo bar baz", "the Lord is my shepherd")).toBe(0);
  });

  it("partial match returns correct fraction", () => {
    // 3 of 4 target words spoken
    expect(calculateWordOverlap("and it came pass", "and it came so")).toBeCloseTo(0.75);
  });

  it("case-insensitive: uppercase KJV start matches lowercase", () => {
    expect(calculateWordOverlap("And it came to pass", "and it came to pass")).toBe(1);
  });

  it("punctuation is stripped", () => {
    expect(calculateWordOverlap("and it came to pass", "And it came to pass,")).toBe(1);
  });

  it("extra filler words in transcript do not reduce score", () => {
    // ASR often adds noise; score should not drop below what matched target words yield
    expect(calculateWordOverlap("um and it came to pass yeah", "and it came to pass")).toBe(1);
  });

  it("empty target returns 1.0 (guard clause)", () => {
    expect(calculateWordOverlap("anything", "")).toBe(1);
  });

  it("empty transcript returns 0.0", () => {
    expect(calculateWordOverlap("", "the Lord is my shepherd")).toBe(0);
  });

  it("repeated word in transcript does not inflate score above 1.0", () => {
    // 'and' repeated 4× should not give credit for the 3 other target words
    expect(calculateWordOverlap("and and and and", "and peace and joy")).toBeCloseTo(0.5);
  });

  describe("KJV archaisms and proper names", () => {
    it("matches KJV archaisms: thee thou hath", () => {
      expect(calculateWordOverlap("I say unto thee thou hath done well", "I say unto thee thou hath done well")).toBe(1);
    });

    it("matches proper name Theophilus", () => {
      expect(calculateWordOverlap("most excellent Theophilus", "most excellent Theophilus")).toBe(1);
    });

    it("matches mixed archaisms partially", () => {
      // spoke 3 of 4 words correctly
      expect(calculateWordOverlap("forasmuch as many hath", "forasmuch as many undertakers")).toBeCloseTo(0.75);
    });
  });
});

describe("asrAccuracyToGrade", () => {
  it("1.0 accuracy → grade 4 (Easy)", () => {
    expect(asrAccuracyToGrade(1.0)).toBe(4);
  });

  it("0.9 accuracy → grade 4 (boundary)", () => {
    expect(asrAccuracyToGrade(0.9)).toBe(4);
  });

  it("0.89 accuracy → grade 3 (Good)", () => {
    expect(asrAccuracyToGrade(0.89)).toBe(3);
  });

  it("0.75 accuracy → grade 3 (ASR_PASS_THRESHOLD boundary)", () => {
    expect(asrAccuracyToGrade(0.75)).toBe(3);
  });

  it("0.74 accuracy → grade 2 (Hard)", () => {
    expect(asrAccuracyToGrade(0.74)).toBe(2);
  });

  it("0.5 accuracy → grade 2 (boundary)", () => {
    expect(asrAccuracyToGrade(0.5)).toBe(2);
  });

  it("0.49 accuracy → grade 1 (Again)", () => {
    expect(asrAccuracyToGrade(0.49)).toBe(1);
  });

  it("0.0 accuracy → grade 1 (Again)", () => {
    expect(asrAccuracyToGrade(0.0)).toBe(1);
  });
});

describe("ASR_PASS_THRESHOLD", () => {
  it("equals 0.75", () => {
    expect(ASR_PASS_THRESHOLD).toBe(0.75);
  });
});
