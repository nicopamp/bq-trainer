"use server";

import { createClient } from "./supabase/server";
import { scheduleReview, Rating } from "./fsrs";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRating = any;
import type { UserVerse } from "./supabase/types";

/** Submit a drill review result and update FSRS state. */
export async function submitReview({
  verseId,
  drillMode,
  grade,
  durationMs,
  transcript,
  accuracy,
}: {
  verseId: number;
  drillMode: "audio" | "finish_it" | "type_out" | "ref_to_verse";
  grade: 1 | 2 | 3 | 4;
  durationMs?: number;
  transcript?: string;
  accuracy?: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: uv } = await supabase
    .from("user_verses")
    .select("*")
    .eq("user_id", user.id)
    .eq("verse_id", verseId)
    .single();

  if (!uv) throw new Error("UserVerse not found");

  const ratingMap: Record<number, AnyRating> = { 1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy };
  const updates = scheduleReview(uv as UserVerse, ratingMap[grade]);

  await Promise.all([
    supabase
      .from("user_verses")
      .update(updates)
      .eq("user_id", user.id)
      .eq("verse_id", verseId),
    supabase.from("reviews").insert({
      user_id: user.id,
      verse_id: verseId,
      drill_mode: drillMode,
      grade,
      duration_ms: durationMs ?? null,
      transcript: transcript ?? null,
      accuracy: accuracy ?? null,
    }),
  ]);

  await updateStreak(supabase, user.id);
}

/** Advance the Learn flow step for a verse. On step 4 (graduation), move state → review. */
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
        stability: 1,
        difficulty: 5,
        due_at: new Date(Date.now() + 86_400_000).toISOString(), // due in 1 day
      }),
    })
    .eq("user_id", user.id)
    .eq("verse_id", verseId);
}

async function updateStreak(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!streak) return;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const last = streak.last_day;

  if (last === today) return;

  const current = last === yesterday ? streak.current_days + 1 : 1;
  await supabase.from("streaks").upsert({
    user_id: userId,
    current_days: current,
    best_days: Math.max(current, streak.best_days),
    last_day: today,
  });
}
