"use server";

import { withAuth } from "./withAuth";
import { insertEvent, patchEvent, deleteEventById } from "../supabase/mutations";

export async function createEvent({
  name,
  date,
  endChapter,
}: {
  name: string;
  date: string;
  endChapter: number;
}) {
  return withAuth((supabase, userId) =>
    insertEvent(supabase, userId, { name, date, end_chapter: endChapter })
  );
}

export async function updateEvent({
  id,
  name,
  date,
  endChapter,
}: {
  id: number;
  name: string;
  date: string;
  endChapter: number;
}) {
  return withAuth((supabase, userId) =>
    patchEvent(supabase, userId, id, { name, date, end_chapter: endChapter })
  );
}

export async function deleteEvent({ id }: { id: number }) {
  return withAuth((supabase, userId) => deleteEventById(supabase, userId, id));
}
