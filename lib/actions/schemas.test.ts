import { describe, it, expect } from "vitest";
import {
  submitReviewSchema,
  advanceLearnStepSchema,
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  createProfileSchema,
  updateProfileSchema,
} from "./schemas";

// ── submitReviewSchema ─────────────────────────────────────────────────────

describe("submitReviewSchema", () => {
  const valid = {
    verseId: 1,
    drillMode: "audio" as const,
    grade: 1 as const,
    durationMs: 0,
    transcript: "In the beginning",
    accuracy: 0.5,
  };

  it.each([
    ["audio", 1, 1, 0, ""],
    ["finish_it", 2, 1, 600_000, "a".repeat(2000)],
    ["type_out", 3, 42, 300_000, undefined],
    ["ref_to_verse", 4, 1, undefined, undefined],
  ] as const)(
    "accepts valid drillMode=%s grade=%s verseId=%s",
    (drillMode, grade, verseId, durationMs, transcript) => {
      expect(() =>
        submitReviewSchema.parse({ ...valid, drillMode, grade, verseId, durationMs, transcript })
      ).not.toThrow();
    }
  );

  it.each([
    { label: "grade 0 rejected", patch: { grade: 0 } },
    { label: "grade 5 rejected", patch: { grade: 5 } },
    { label: "grade 1.5 rejected", patch: { grade: 1.5 } },
    { label: "unknown drillMode rejected", patch: { drillMode: "unknown_mode" } },
    { label: "verseId 0 rejected", patch: { verseId: 0 } },
    { label: "verseId -1 rejected", patch: { verseId: -1 } },
    { label: "verseId float rejected", patch: { verseId: 1.5 } },
    { label: "durationMs -1 rejected", patch: { durationMs: -1 } },
    { label: "durationMs 600001 rejected", patch: { durationMs: 600_001 } },
    { label: "transcript 2001 chars rejected", patch: { transcript: "a".repeat(2001) } },
    { label: "accuracy -0.01 rejected", patch: { accuracy: -0.01 } },
    { label: "accuracy 1.01 rejected", patch: { accuracy: 1.01 } },
    { label: "verseId string rejected", patch: { verseId: "abc" } },
  ])("$label", ({ patch }) => {
    expect(() => submitReviewSchema.parse({ ...valid, ...patch })).toThrow();
  });

  it("accuracy 0 and 1 are boundary values that pass", () => {
    expect(() => submitReviewSchema.parse({ ...valid, accuracy: 0 })).not.toThrow();
    expect(() => submitReviewSchema.parse({ ...valid, accuracy: 1 })).not.toThrow();
  });
});

// ── advanceLearnStepSchema ─────────────────────────────────────────────────

describe("advanceLearnStepSchema", () => {
  it.each([0, 1, 2, 3, 4, 5])("nextStep=%s is valid", (nextStep) => {
    expect(() => advanceLearnStepSchema.parse({ verseId: 1, nextStep })).not.toThrow();
  });

  it.each([
    { label: "nextStep -1 rejected", patch: { nextStep: -1 } },
    { label: "nextStep 6 rejected", patch: { nextStep: 6 } },
    { label: "nextStep float rejected", patch: { nextStep: 1.5 } },
    { label: "verseId 0 rejected", patch: { verseId: 0 } },
    { label: "verseId string rejected", patch: { verseId: "abc" } },
  ])("$label", ({ patch }) => {
    expect(() => advanceLearnStepSchema.parse({ verseId: 1, nextStep: 0, ...patch })).toThrow();
  });
});

// ── createEventSchema ──────────────────────────────────────────────────────

describe("createEventSchema", () => {
  const valid = { name: "Quiz Night", date: "2026-06-01", endChapter: 5 };

  it("accepts a valid event", () => {
    expect(() => createEventSchema.parse(valid)).not.toThrow();
  });

  it.each([
    { label: "name 1 char", patch: { name: "A" } },
    { label: "name 80 chars", patch: { name: "A".repeat(80) } },
    { label: "endChapter 1", patch: { endChapter: 1 } },
    { label: "endChapter 150", patch: { endChapter: 150 } },
  ])("boundary: $label passes", ({ patch }) => {
    expect(() => createEventSchema.parse({ ...valid, ...patch })).not.toThrow();
  });

  it.each([
    { label: "name empty rejected", patch: { name: "" } },
    { label: "name whitespace-only rejected", patch: { name: "   " } },
    { label: "name 81 chars rejected", patch: { name: "A".repeat(81) } },
    { label: "endChapter 0 rejected", patch: { endChapter: 0 } },
    { label: "endChapter 151 rejected", patch: { endChapter: 151 } },
    { label: "endChapter float rejected", patch: { endChapter: 1.5 } },
    { label: "date not ISO rejected", patch: { date: "June 1 2026" } },
    { label: "date empty rejected", patch: { date: "" } },
    { label: "missing name", patch: { name: undefined } },
  ])("$label", ({ patch }) => {
    expect(() => createEventSchema.parse({ ...valid, ...patch })).toThrow();
  });
});

// ── updateEventSchema ──────────────────────────────────────────────────────

describe("updateEventSchema", () => {
  const valid = { id: 1, name: "Quiz Night", date: "2026-06-01", endChapter: 5 };

  it("accepts valid update input", () => {
    expect(() => updateEventSchema.parse(valid)).not.toThrow();
  });

  it.each([
    { label: "id 0 rejected", patch: { id: 0 } },
    { label: "id -1 rejected", patch: { id: -1 } },
    { label: "id float rejected", patch: { id: 1.5 } },
    { label: "name empty rejected", patch: { name: "" } },
    { label: "name whitespace-only rejected", patch: { name: "   " } },
  ])("$label", ({ patch }) => {
    expect(() => updateEventSchema.parse({ ...valid, ...patch })).toThrow();
  });
});

// ── deleteEventSchema ──────────────────────────────────────────────────────

describe("deleteEventSchema", () => {
  it("accepts positive int id", () => {
    expect(() => deleteEventSchema.parse({ id: 42 })).not.toThrow();
  });

  it.each([
    { label: "id 0 rejected", patch: { id: 0 } },
    { label: "id -1 rejected", patch: { id: -1 } },
    { label: "id float rejected", patch: { id: 1.5 } },
    { label: "id string rejected", patch: { id: "abc" } },
  ])("$label", ({ patch }) => {
    expect(() => deleteEventSchema.parse({ ...{ id: 1 }, ...patch })).toThrow();
  });
});

// ── createProfileSchema ────────────────────────────────────────────────────

describe("createProfileSchema", () => {
  const valid = { fullName: "Alice Smith", quizCategory: "TBQ" as const, church: "First Baptist" };

  it("accepts a valid profile", () => {
    expect(() => createProfileSchema.parse(valid)).not.toThrow();
  });

  it.each([
    { label: "TBQ category", patch: { quizCategory: "TBQ" } },
    { label: "EABQ category", patch: { quizCategory: "EABQ" } },
    { label: "fullName 1 char", patch: { fullName: "A" } },
    { label: "fullName 80 chars", patch: { fullName: "A".repeat(80) } },
    { label: "church 1 char", patch: { church: "A" } },
    { label: "church 120 chars", patch: { church: "A".repeat(120) } },
  ])("boundary: $label passes", ({ patch }) => {
    expect(() => createProfileSchema.parse({ ...valid, ...patch })).not.toThrow();
  });

  it.each([
    { label: "unknown quizCategory rejected", patch: { quizCategory: "OTHER" } },
    { label: "fullName empty rejected", patch: { fullName: "" } },
    { label: "fullName whitespace-only rejected", patch: { fullName: "   " } },
    { label: "fullName 81 chars rejected", patch: { fullName: "A".repeat(81) } },
    { label: "church empty rejected", patch: { church: "" } },
    { label: "church whitespace-only rejected", patch: { church: "   " } },
    { label: "church 121 chars rejected", patch: { church: "A".repeat(121) } },
    { label: "missing fullName", patch: { fullName: undefined } },
  ])("$label", ({ patch }) => {
    expect(() => createProfileSchema.parse({ ...valid, ...patch })).toThrow();
  });
});

// ── updateProfileSchema ────────────────────────────────────────────────────

describe("updateProfileSchema", () => {
  const valid = { fullName: "Alice Smith", quizCategory: "EABQ" as const, church: "Grace Church" };

  it("accepts a valid profile update", () => {
    expect(() => updateProfileSchema.parse(valid)).not.toThrow();
  });

  it("rejects oversized church (121 chars)", () => {
    expect(() => updateProfileSchema.parse({ ...valid, church: "A".repeat(121) })).toThrow();
  });
});
