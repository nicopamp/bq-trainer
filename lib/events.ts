import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event } from "./supabase/types";

// ── Pure helpers ──────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

export function getDaysUntil(event: Event): number {
  const now = new Date();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const [y, m, d] = event.date.split("-").map(Number);
  const eventMs = Date.UTC(y, m - 1, d);
  return Math.round((eventMs - todayMs) / MS_PER_DAY);
}

export const EVENT_COUNTDOWN_THRESHOLD = 60;

export function isEventUpcoming(event: Event): boolean {
  const days = getDaysUntil(event);
  return days >= 0 && days <= EVENT_COUNTDOWN_THRESHOLD;
}

// ── Queries ───────────────────────────────────────────────────────

export async function getNextEvent(
  supabase: SupabaseClient,
  userId: string
): Promise<Event | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .gte("date", today)
    .order("date")
    .limit(1)
    .single();
  return (data as Event) ?? null;
}

export interface ReadinessSummary {
  inScope: number;
  mastered: number;
}

export async function getReadinessSummary(
  supabase: SupabaseClient,
  userId: string,
  event: Event
): Promise<ReadinessSummary> {
  const { data: verses } = await supabase
    .from("user_verses")
    .select("state, verses!inner(chapter)")
    .eq("user_id", userId)
    .lte("verses.chapter", event.end_chapter);

  if (!verses || verses.length === 0) {
    return { inScope: 0, mastered: 0 };
  }

  const inScope = verses.length;
  const mastered = verses.filter(
    (v: any) => v.state === "review" || v.state === "mastered"
  ).length;

  return { inScope, mastered };
}

export async function getUserEvents(
  supabase: SupabaseClient,
  userId: string
): Promise<Event[]> {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("date");
  return (data as Event[]) ?? [];
}

export async function getEventById(
  supabase: SupabaseClient,
  eventId: number
): Promise<Event | null> {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  return (data as Event) ?? null;
}
