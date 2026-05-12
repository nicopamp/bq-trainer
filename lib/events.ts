import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event } from "./supabase/types";

// ── Pure helpers ──────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

export function getDaysUntil(event: Event): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date + "T00:00:00");
  return Math.round((eventDate.getTime() - today.getTime()) / MS_PER_DAY);
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
  total: number;
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
    return { inScope: 0, mastered: 0, total: 0 };
  }

  const total = verses.length;
  const mastered = verses.filter(
    (v: any) => v.state === "review" || v.state === "mastered"
  ).length;

  return { inScope: total, mastered, total };
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
