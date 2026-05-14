import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { LearnReadClient } from "./LearnReadClient";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string; verseId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { chapterId, verseId } = await params;
  const { from } = await searchParams;
  const ch = parseInt(chapterId);
  const v = parseInt(verseId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: verse } = await supabase
    .from("verses")
    .select("id, book, text, chapter, verse")
    .eq("chapter", ch)
    .eq("verse", v)
    .eq("translation", "KJV")
    .single();

  if (!verse) notFound();

  const { data: userVerse } = await supabase
    .from("user_verses")
    .select("state, learn_step")
    .eq("user_id", user.id)
    .eq("verse_id", verse.id)
    .single();

  const step = userVerse?.learn_step ?? 0;
  const state = userVerse?.state ?? "new";

  // If the verse is already in review/mastered, redirect to drill
  if (state === "review" || state === "mastered") {
    redirect(`/drill?verse=${verse.id}`);
  }

  const backHref = from === "home" ? "/home" : `/chapter/${ch}`;

  return (
    <LearnReadClient
      verseId={verse.id}
      chapter={ch}
      verseNum={v}
      text={verse.text}
      initialStep={step as 0 | 1 | 2 | 3 | 4}
      book={verse.book}
      backHref={backHref}
    />
  );
}
