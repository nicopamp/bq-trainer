"use server";

import { scheduleReview, Rating } from "../fsrs";
import type { UserVerse } from "../supabase/types";
import { withAuth } from "./withAuth";
import { updateUserVerse, insertReview, refreshStreak } from "../supabase/mutations";

type AnyRating = any; // ts-fsrs Rating enum lacks exported type

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
  return withAuth(async (supabase, userId) => {
    const { data: uv } = await supabase
      .from("user_verses")
      .select("*")
      .eq("user_id", userId)
      .eq("verse_id", verseId)
      .single();

    if (!uv) throw new Error("UserVerse not found");

    const ratingMap: Record<number, AnyRating> = { 1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy };
    const updates = scheduleReview(uv as UserVerse, ratingMap[grade]);

    await Promise.all([
      updateUserVerse(supabase, userId, verseId, updates as Record<string, unknown>),
      insertReview(supabase, {
        user_id: userId,
        verse_id: verseId,
        drill_mode: drillMode,
        grade,
        duration_ms: durationMs ?? null,
        transcript: transcript ?? null,
        accuracy: accuracy ?? null,
      }),
    ]);

    await refreshStreak(supabase, userId);
  });
}
