import { z } from "zod";

const positiveInt = z.number().int().positive();

export const submitReviewSchema = z.object({
  verseId: positiveInt,
  drillMode: z.enum(["audio", "finish_it", "type_out", "ref_to_verse"]),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  durationMs: z.number().int().min(0).max(600_000).optional(),
  transcript: z.string().max(2000).optional(),
  accuracy: z.number().min(0).max(1).optional(),
});

export const advanceLearnStepSchema = z.object({
  verseId: positiveInt,
  nextStep: z.number().int().min(0).max(5),
});

const nonEmptyTrimmed = (max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 1, { message: "Required" })
    .pipe(z.string().max(max));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Must be ISO date (YYYY-MM-DD)" });

export const createEventSchema = z.object({
  name: nonEmptyTrimmed(80),
  date: isoDate,
  endChapter: z.number().int().min(1).max(150),
});

export const updateEventSchema = z.object({
  id: positiveInt,
  name: nonEmptyTrimmed(80),
  date: isoDate,
  endChapter: z.number().int().min(1).max(150),
});

export const deleteEventSchema = z.object({
  id: positiveInt,
});

export const createProfileSchema = z.object({
  fullName: nonEmptyTrimmed(80),
  quizCategory: z.enum(["TBQ", "EABQ"]),
  church: nonEmptyTrimmed(120),
});

export const updateProfileSchema = z.object({
  fullName: nonEmptyTrimmed(80),
  quizCategory: z.enum(["TBQ", "EABQ"]),
  church: nonEmptyTrimmed(120),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type AdvanceLearnStepInput = z.infer<typeof advanceLearnStepSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type DeleteEventInput = z.infer<typeof deleteEventSchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
