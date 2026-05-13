"use server";

import { createClient } from "../supabase/server";
import { GRADUATION_FSRS_SEED } from "../fsrs";

/** Advance the Learn Flow step for a verse. On step 4 (Graduation), move state → review. */
export async function advanceLearnStep(verseId: number, nextStep: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const isGraduating = nextStep >= 5;

  await supabase
    .from("user_verses")
    .update({
      learn_step: isGraduating ? 0 : nextStep,
      state: isGraduating ? "review" : "learning",
      ...(isGraduating && {
        stability: GRADUATION_FSRS_SEED.stability,
        difficulty: GRADUATION_FSRS_SEED.difficulty,
        due_at: new Date(Date.now() + GRADUATION_FSRS_SEED.dueDays * 86_400_000).toISOString(),
      }),
    })
    .eq("user_id", user.id)
    .eq("verse_id", verseId);
}
