"use server";

import { withAuth } from "./withAuth";
import { insertEvent, patchEvent, deleteEventById } from "../supabase/mutations";
import {
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type DeleteEventInput,
} from "./schemas";

export async function createEvent(input: CreateEventInput) {
  const { name, date, endChapter } = createEventSchema.parse(input);
  return withAuth((supabase, userId) =>
    insertEvent(supabase, userId, { name, date, end_chapter: endChapter })
  );
}

export async function updateEvent(input: UpdateEventInput) {
  const { id, name, date, endChapter } = updateEventSchema.parse(input);
  return withAuth((supabase, userId) =>
    patchEvent(supabase, userId, id, { name, date, end_chapter: endChapter })
  );
}

export async function deleteEvent(input: DeleteEventInput) {
  const { id } = deleteEventSchema.parse(input);
  return withAuth((supabase, userId) => deleteEventById(supabase, userId, id));
}
