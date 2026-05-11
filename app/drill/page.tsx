import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    // Find the first verse the user hasn't started learning yet
    const { data: nextNew } = await supabase
      .from("user_verses")
      .select("verse_id, verses(chapter, verse)")
      .eq("user_id", user.id)
      .eq("state", "new")
      .order("verse_id")
      .limit(1)
      .single();

    const nextVerse = nextNew ? (Array.isArray(nextNew.verses) ? nextNew.verses[0] : nextNew.verses) as any : null;

    return (
      <div className="bqt-screen" style={{ justifyContent: "center", gap: "var(--s-3)", padding: "0 28px" }}>
        <p className="eyebrow" style={{ color: "var(--leaf-500)" }}>All caught up</p>
        <p className="t-display" style={{ fontSize: 26, textAlign: "center", lineHeight: 1.15 }}>Nothing due right now</p>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.5, maxWidth: 300 }}>
          {chapter
            ? `No reviews due in Acts ${chapter}.`
            : "No reviews are scheduled for today."}
          {" "}Drill sessions appear here once you&apos;ve learned verses — each one is scheduled to reappear at the right moment.
        </p>
        {nextVerse ? (
          <Link
            href={`/learn/${nextVerse.chapter}/${nextVerse.verse}`}
            className="btn btn-saffron btn-lg"
            style={{ marginTop: "var(--s-2)" }}
          >
            Learn Acts {nextVerse.chapter}:{nextVerse.verse} →
          </Link>
        ) : null}
        <Link href="/home" className="btn btn-ghost btn-md" style={{ marginTop: nextVerse ? 0 : "var(--s-2)" }}>
          Back to home
        </Link>
      </div>
    );
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
