export interface ProfileDraft {
  fullName: string;
  quizCategory: string;
  church: string;
}

export function isProfileComplete(draft: ProfileDraft): boolean {
  return (
    draft.fullName.trim() !== "" &&
    draft.quizCategory !== "" &&
    draft.church.trim() !== ""
  );
}
