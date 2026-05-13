"use server";

import { createClient } from "../supabase/server";

export async function createEvent({
  name,
  date,
  endChapter,
}: {
  name: string;
  date: string;
  endChapter: number;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("events").insert({
    user_id: user.id,
    name,
    date,
    end_chapter: endChapter,
  });
  if (error) throw new Error(error.message);
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("events")
    .update({ name, date, end_chapter: endChapter })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

export async function deleteEvent({ id }: { id: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
}
