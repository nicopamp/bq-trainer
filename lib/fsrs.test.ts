import { describe, it, expect } from "vitest";
import { toCard, scheduleReview, Rating, MASTERY_STABILITY_DAYS } from "./fsrs";
import type { UserVerse } from "./supabase/types";

// Minimal UserVerse fixture with no FSRS history (brand-new verse)
const newUV: UserVerse = {
  user_id: "u",
  verse_id: 1,
  state: "new",
  learn_step: 0,
  stability: null,
  difficulty: null,
  due_at: null,
  last_reviewed_at: null,
  reps: 0,
  lapses: 0,
};

// Verse in review state, low stability (well within MASTERY_STABILITY_DAYS)
const reviewUV: UserVerse = {
  ...newUV,
  state: "review",
  learn_step: 5,
  stability: 5,
  difficulty: 5,
  due_at: new Date().toISOString(),
  last_reviewed_at: new Date(Date.now() - 86_400_000).toISOString(),
  reps: 3,
  lapses: 0,
};

// Verse in review state, high stability (well above MASTERY_STABILITY_DAYS = 30)
const stableReviewUV: UserVerse = {
  ...reviewUV,
  stability: 45,
  reps: 20,
};

// Verse already mastered
const masteredUV: UserVerse = {
  ...stableReviewUV,
  state: "mastered",
};

// Verse still in learning
const learningUV: UserVerse = {
  ...reviewUV,
  state: "learning",
  stability: 1,
  reps: 1,
};

describe("toCard", () => {
  it("verse with no prior reviews returns an empty card with zero reps", () => {
    const card = toCard(newUV);
    expect(card).toBeTruthy();
    expect(card.reps).toBe(0);
    expect(card.stability).toBe(0);
  });

  it("verse with FSRS fields maps stability, difficulty, reps, and lapses", () => {
    const card = toCard(reviewUV);
    expect(card.stability).toBe(reviewUV.stability);
    expect(card.difficulty).toBe(reviewUV.difficulty);
    expect(card.reps).toBe(reviewUV.reps);
    expect(card.lapses).toBe(reviewUV.lapses);
  });
});

describe("scheduleReview — state transitions", () => {
  it("Again on review stays review", () => {
    expect(scheduleReview(reviewUV, Rating.Again).state).toBe("review");
  });

  it("Again on mastered demotes to review", () => {
    expect(scheduleReview(masteredUV, Rating.Again).state).toBe("review");
  });

  it("Good on learning promotes to review (Graduation)", () => {
    expect(scheduleReview(learningUV, Rating.Good).state).toBe("review");
  });

  it("Hard on learning stays learning", () => {
    expect(scheduleReview(learningUV, Rating.Hard).state).toBe("learning");
  });

  it("Good on review with stability <= 30 stays review", () => {
    // reviewUV.stability = 5 — post-review stability will also be < 30
    expect(scheduleReview(reviewUV, Rating.Good).state).toBe("review");
  });

  it("Good on review with stability > 30 promotes to mastered", () => {
    // stableReviewUV.stability = 45 — post-review stability will be well above 30
    expect(scheduleReview(stableReviewUV, Rating.Good).state).toBe("mastered");
  });

  it("Hard on mastered demotes to review", () => {
    expect(scheduleReview(masteredUV, Rating.Hard).state).toBe("review");
  });
});

describe("scheduleReview — return shape", () => {
  it("always returns all DB persistence fields", () => {
    const result = scheduleReview(reviewUV, Rating.Good);
    expect(result).toMatchObject({
      stability: expect.any(Number),
      difficulty: expect.any(Number),
      due_at: expect.any(String),
      last_reviewed_at: expect.any(String),
      reps: expect.any(Number),
      lapses: expect.any(Number),
      state: expect.any(String),
    });
  });
});
