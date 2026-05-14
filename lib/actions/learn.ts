"use server";

import { GRADUATION_FSRS_SEED } from "../fsrs";
import { withAuth } from "./withAuth";
import { updateUserVerse } from "../supabase/mutations";

export async function advanceLearnStep(verseId: number, nextStep: number) {
  return withAuth(async (supabase, userId) => {
    const isGraduating = nextStep >= 5;
    await updateUserVerse(supabase, userId, verseId, {
      learn_step: isGraduating ? 0 : nextStep,
      state: isGraduating ? "review" : "learning",
      ...(isGraduating && {
        stability: GRADUATION_FSRS_SEED.stability,
        difficulty: GRADUATION_FSRS_SEED.difficulty,
        due_at: new Date(Date.now() + GRADUATION_FSRS_SEED.dueDays * 86_400_000).toISOString(),
      }),
    });
  });
}
