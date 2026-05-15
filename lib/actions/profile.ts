"use server";

import { withAuth } from "./withAuth";
import { insertProfile, patchProfile } from "../supabase/mutations";
import {
  createProfileSchema,
  updateProfileSchema,
  type CreateProfileInput,
  type UpdateProfileInput,
} from "./schemas";

export async function createProfile(input: CreateProfileInput) {
  const { fullName, quizCategory, church } = createProfileSchema.parse(input);
  return withAuth((supabase, userId) =>
    insertProfile(supabase, userId, { full_name: fullName, quiz_category: quizCategory, church })
  );
}

export async function updateProfile(input: UpdateProfileInput) {
  const { fullName, quizCategory, church } = updateProfileSchema.parse(input);
  return withAuth((supabase, userId) =>
    patchProfile(supabase, userId, { full_name: fullName, quiz_category: quizCategory, church })
  );
}
