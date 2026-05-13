"use server";

import { createClient } from "../supabase/server";

export async function createProfile({
  fullName,
  quizCategory,
  church,
}: {
  fullName: string;
  quizCategory: "TBQ" | "EABQ";
  church: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("profiles").insert({
    user_id: user.id,
    full_name: fullName,
    quiz_category: quizCategory,
    church,
  });
  if (error) throw new Error(error.message);
}

export async function updateProfile({
  fullName,
  quizCategory,
  church,
}: {
  fullName: string;
  quizCategory: "TBQ" | "EABQ";
  church: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      quiz_category: quizCategory,
      church,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
}
