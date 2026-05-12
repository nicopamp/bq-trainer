const { createEmptyCard, fsrs, generatorParameters, Rating } = require("ts-fsrs"); // ts-fsrs ESM/CJS interop
import type { Card } from "ts-fsrs";
import type { UserVerse, VerseState } from "./supabase/types";

const f = fsrs(generatorParameters({ enable_fuzz: true, maximum_interval: 365 }));

export { Rating };

/** Stability threshold (days) at which a verse transitions from review → mastered. */
export const MASTERY_STABILITY_DAYS = 30;

/** FSRS field values seeded at Learn Flow graduation (before any real reviews). */
export const GRADUATION_FSRS_SEED = { stability: 1, difficulty: 5, dueDays: 1 } as const;

export type RatingType = typeof Rating[keyof typeof Rating];

/** Convert a Supabase user_verse row into an FSRS Card. */
export function toCard(uv: UserVerse): Card {
  if (!uv.stability || !uv.difficulty || !uv.due_at) {
    return createEmptyCard(new Date());
  }

  return {
    due: new Date(uv.due_at),
    stability: uv.stability,
    difficulty: uv.difficulty,
    elapsed_days: uv.last_reviewed_at
      ? Math.floor((Date.now() - new Date(uv.last_reviewed_at).getTime()) / 86_400_000)
      : 0,
    scheduled_days: 0,
    reps: uv.reps,
    lapses: uv.lapses,
    state: fsrsState(uv.state),
    last_review: uv.last_reviewed_at ? new Date(uv.last_reviewed_at) : undefined,
  };
}

/** Schedule a review and return the updated fields to persist. */
export function scheduleReview(uv: UserVerse, rating: any) { // any: ts-fsrs Rating enum lacks exported type
  const card = toCard(uv);
  const now = new Date();
  const result = f.next(card, now, rating);
  const next = result.card;

  const newState = deriveState(uv.state, rating, next.stability);

  return {
    stability: next.stability,
    difficulty: next.difficulty,
    due_at: next.due.toISOString(),
    last_reviewed_at: now.toISOString(),
    reps: next.reps,
    lapses: next.lapses,
    state: newState,
  };
}

function fsrsState(s: VerseState): 0 | 1 | 2 | 3 {
  switch (s) {
    case "new": return 0;
    case "learning": return 1;
    case "review": return 2;
    default: return 2;
  }
}

function deriveState(current: VerseState, rating: any, stability: number): VerseState {
  if (rating === Rating.Again) return current === "mastered" ? "review" : current;
  if (current === "learning" && rating >= Rating.Good) return "review";
  if (current === "review" && stability > MASTERY_STABILITY_DAYS && rating >= Rating.Good) return "mastered";
  if (current === "mastered" && rating === Rating.Hard) return "review";
  return current;
}
