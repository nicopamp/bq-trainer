import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getActiveBook, getBookChapterCounts } from "@/lib/supabase/queries";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const activeBook = await getActiveBook(supabase, user.id);
  const chapterCounts = await getBookChapterCounts(supabase, activeBook);
  const chapters = Object.keys(chapterCounts).map(Number).sort((a, b) => a - b);
  const chapterRange = chapters.length > 0 ? `${chapters[0]}–${chapters[chapters.length - 1]}` : "";

  return <SettingsClient bookLabel={`${activeBook} ${chapterRange}`} bookName={activeBook} />;
}
