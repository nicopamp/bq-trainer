import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, VerseState } from "./types";

// ── Shared types ───────────────────────────────────────────────────

export interface VerseRef {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface DueVerseRow {
  verse_id: number;
  state: string;
  due_at: string | null;
  verses: VerseRef | VerseRef[] | null;
}

export interface UserVerseStateRow {
  verse_id: number;
  state: VerseState;
  due_at: string | null;
  verses: { chapter: number; verse: number } | { chapter: number; verse: number }[] | null;
}

export interface ChapterVerseRow {
  id: number;
  verse: number;
  text: string;
  user_verses:
    | { state: string; learn_step: number; due_at: string | null; stability: number | null }
    | { state: string; learn_step: number; due_at: string | null; stability: number | null }[]
    | null;
}

/** Extract the joined verse object from a Supabase lateral join result. */
export function extractVerse<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

// ── Query functions ────────────────────────────────────────────────

/** Fetch due verses for a Drill session. */
export async function getDueVerses(
  supabase: SupabaseClient,
  userId: string,
  options: { chapter?: number; verseId?: number; isForced?: boolean }
): Promise<DueVerseRow[]> {
  const { chapter, verseId, isForced } = options;
  const dueCutoff = isForced ? "9999-12-31T00:00:00Z" : new Date().toISOString();

  let query;

  if (verseId) {
    query = supabase
      .from("user_verses")
      .select("verse_id, state, due_at, verses(id, book, chapter, verse, text)")
      .eq("user_id", userId)
      .eq("verse_id", verseId)
      .in("state", ["review", "mastered", "learning"])
      .limit(1);
  } else if (chapter) {
    query = supabase
      .from("user_verses")
      .select("verse_id, state, due_at, verses!inner(id, book, chapter, verse, text)")
      .eq("user_id", userId)
      .in("state", ["review", "mastered", "learning"])
      .lte("due_at", dueCutoff)
      .eq("verses.chapter", chapter)
      .order("due_at")
      .limit(60);
  } else {
    query = supabase
      .from("user_verses")
      .select("verse_id, state, due_at, verses(id, book, chapter, verse, text)")
      .eq("user_id", userId)
      .in("state", ["review", "mastered", "learning"])
      .lte("due_at", dueCutoff)
      .order("due_at")
      .limit(30);
  }

  const { data } = await query;
  return (data as DueVerseRow[]) ?? [];
}

/** Fetch the first verse the user hasn't started learning. */
export async function getNextNewVerse(
  supabase: SupabaseClient,
  userId: string
): Promise<{ verse_id: number; chapter: number; verse: number } | null> {
  const { data } = await supabase
    .from("user_verses")
    .select("verse_id, verses(chapter, verse)")
    .eq("user_id", userId)
    .eq("state", "new")
    .order("verse_id")
    .limit(1)
    .single();

  if (!data) return null;
  const v = extractVerse(data.verses as any);
  if (!v) return null;
  return { verse_id: data.verse_id, chapter: (v as any).chapter, verse: (v as any).verse };
}

/** Fetch all user verse states (chapter heatmap, progress counts). */
export async function getUserVerseStates(
  supabase: SupabaseClient,
  userId: string
): Promise<UserVerseStateRow[]> {
  const { data } = await supabase
    .from("user_verses")
    .select("verse_id, state, due_at, verses(chapter, verse)")
    .eq("user_id", userId);
  return (data as UserVerseStateRow[]) ?? [];
}

/** Fetch verses + user state for a single chapter. */
export async function getChapterVerses(
  supabase: SupabaseClient,
  userId: string,
  chapter: number,
  book = "Acts"
): Promise<ChapterVerseRow[]> {
  const { data } = await supabase
    .from("verses")
    .select("id, verse, text, user_verses(state, learn_step, due_at, stability)")
    .eq("chapter", chapter)
    .eq("book", book)
    .eq("translation", "KJV")
    .eq("user_verses.user_id", userId)
    .order("verse");
  return (data as ChapterVerseRow[]) ?? [];
}

/** Derive the active book from the user's user_verses rows. */
export async function getActiveBook(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("user_verses")
    .select("verses(book)")
    .eq("user_id", userId)
    .limit(1)
    .single();
  const v = extractVerse((data as any)?.verses);
  return (v as any)?.book ?? "Acts";
}

/** Get verse counts per chapter for a book from the DB. */
export async function getBookChapterCounts(
  supabase: SupabaseClient,
  book: string
): Promise<Record<number, number>> {
  const { data } = await supabase
    .from("verses")
    .select("chapter")
    .eq("book", book)
    .eq("translation", "KJV");
  const counts: Record<number, number> = {};
  if (data) {
    for (const row of data) {
      counts[row.chapter] = (counts[row.chapter] ?? 0) + 1;
    }
  }
  return counts;
}

/** Fetch the user's streak record. */
export async function getStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<{ current_days: number; best_days: number } | null> {
  const { data } = await supabase
    .from("streaks")
    .select("current_days, best_days")
    .eq("user_id", userId)
    .single();
  return data ?? null;
}

/** Fetch the user's profile, or null if not yet created. */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, quiz_category, church, created_at, updated_at")
    .eq("user_id", userId)
    .single();
  return (data as Profile) ?? null;
}

/** Fetch reviews from the past 7 days. */
export async function getWeeklyReviews(
  supabase: SupabaseClient,
  userId: string
): Promise<{ grade: number; created_at: string; drill_mode: string | null }[]> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("reviews")
    .select("grade, created_at, drill_mode")
    .eq("user_id", userId)
    .gte("created_at", weekAgo);
  return (data as any[]) ?? [];
}