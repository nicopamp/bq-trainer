import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DrillClient } from "./DrillClient";

export default async function DrillPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; verse?: string }>;
}) {
  const { chapter } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Build due verse queue
  const now = new Date().toISOString();
  let query = supabase
    .from("user_verses")
    .select("verse_id, state, stability, difficulty, due_at, reps, lapses, learn_step, verses(id, chapter, verse, text)")
    .eq("user_id", user.id)
    .in("state", ["review", "mastered", "learning"])
    .lte("due_at", now)
    .order("due_at")
    .limit(30);

  if (chapter) {
    // Filter by chapter via subquery approach — join through verses
    query = supabase
      .from("user_verses")
      .select("verse_id, state, stability, difficulty, due_at, reps, lapses, learn_step, verses!inner(id, chapter, verse, text)")
      .eq("user_id", user.id)
      .in("state", ["review", "mastered", "learning"])
      .lte("due_at", now)
      .eq("verses.chapter", parseInt(chapter))
      .order("due_at")
      .limit(30);
  }

  const { data: dueVerses } = await query;

  if (!dueVerses || dueVerses.length === 0) {
    redirect("/home");
  }

  // Build drill items with assigned modes
  const MODES = ["audio", "finish_it", "type_out", "ref_to_verse"] as const;
  const drillItems = dueVerses.map((uv, i) => {
    const verse = Array.isArray(uv.verses) ? uv.verses[0] : uv.verses;
    return {
      verseId: uv.verse_id,
      chapter: (verse as any)?.chapter ?? 0,
      verseNum: (verse as any)?.verse ?? 0,
      text: (verse as any)?.text ?? "",
      mode: MODES[i % MODES.length],
      state: uv.state,
    };
  });

  return <DrillClient items={drillItems} />;
}
