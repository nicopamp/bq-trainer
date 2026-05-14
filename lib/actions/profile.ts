"use server";

import { withAuth } from "./withAuth";
import { insertProfile, patchProfile } from "../supabase/mutations";

export async function createProfile({
  fullName,
  quizCategory,
  church,
}: {
  fullName: string;
  quizCategory: "TBQ" | "EABQ";
  church: string;
}) {
  return withAuth((supabase, userId) =>
    insertProfile(supabase, userId, { full_name: fullName, quiz_category: quizCategory, church })
  );
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
  return withAuth((supabase, userId) =>
    patchProfile(supabase, userId, { full_name: fullName, quiz_category: quizCategory, church })
  );
}
