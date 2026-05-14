import type { SupabaseClient } from "@supabase/supabase-js";
import type { DrillMode } from "./types";

// ── user_verses ────────────────────────────────────────────────────

export async function updateUserVerse(
  supabase: SupabaseClient,
  userId: string,
  verseId: number,
  updates: Record<string, unknown>
) {
  const { error } = await supabase
    .from("user_verses")
    .update(updates)
    .eq("user_id", userId)
    .eq("verse_id", verseId);
  if (error) throw new Error(error.message);
}

// ── reviews ────────────────────────────────────────────────────────

export async function insertReview(
  supabase: SupabaseClient,
  payload: {
    user_id: string;
    verse_id: number;
    drill_mode: DrillMode;
    grade: 1 | 2 | 3 | 4;
    duration_ms: number | null;
    transcript: string | null;
    accuracy: number | null;
  }
) {
  const { error } = await supabase.from("reviews").insert(payload);
  if (error) throw new Error(error.message);
}

// ── streaks ────────────────────────────────────────────────────────

export async function refreshStreak(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data: streak } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!streak) return;

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  if (streak.last_day === today) return;

  const current = streak.last_day === yesterday ? streak.current_days + 1 : 1;
  await supabase.from("streaks").upsert({
    user_id: userId,
    current_days: current,
    best_days: Math.max(current, streak.best_days),
    last_day: today,
  });
}

// ── events ─────────────────────────────────────────────────────────

export async function insertEvent(
  supabase: SupabaseClient,
  userId: string,
  payload: { name: string; date: string; end_chapter: number }
) {
  const { error } = await supabase.from("events").insert({ user_id: userId, ...payload });
  if (error) throw new Error(error.message);
}

export async function patchEvent(
  supabase: SupabaseClient,
  userId: string,
  id: number,
  payload: { name: string; date: string; end_chapter: number }
) {
  const { error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteEventById(
  supabase: SupabaseClient,
  userId: string,
  id: number
) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// ── profiles ───────────────────────────────────────────────────────

export async function insertProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: { full_name: string; quiz_category: "TBQ" | "EABQ"; church: string }
) {
  const { error } = await supabase.from("profiles").insert({ user_id: userId, ...payload });
  if (error) throw new Error(error.message);
}

export async function patchProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: { full_name: string; quiz_category: "TBQ" | "EABQ"; church: string }
) {
  const { error } = await supabase
    .from("profiles")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
