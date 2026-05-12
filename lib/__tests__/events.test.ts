import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDaysUntil } from "@/lib/events";
import type { Event } from "@/lib/supabase/types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    user_id: "user-1",
    name: "League Meet",
    date: "2026-06-01",
    end_chapter: 5,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getDaysUntil", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns positive days for a future event", () => {
    vi.setSystemTime(new Date("2026-05-12"));
    expect(getDaysUntil(makeEvent({ date: "2026-05-22" }))).toBe(10);
  });

  it("returns 0 on the event day", () => {
    vi.setSystemTime(new Date("2026-06-01"));
    expect(getDaysUntil(makeEvent({ date: "2026-06-01" }))).toBe(0);
  });

  it("returns negative days for a past event", () => {
    vi.setSystemTime(new Date("2026-06-05"));
    expect(getDaysUntil(makeEvent({ date: "2026-06-01" }))).toBe(-4);
  });

  it("handles cross-month boundaries", () => {
    vi.setSystemTime(new Date("2026-05-28"));
    expect(getDaysUntil(makeEvent({ date: "2026-06-03" }))).toBe(6);
  });
});
