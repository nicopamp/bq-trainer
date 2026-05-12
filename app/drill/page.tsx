import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DrillClient } from "./DrillClient";

export default async function DrillPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; verse?: string; force?: string }>;
}) {
  const { chapter, verse, force } = await searchParams;
  const isForced = force === "true" || !!verse;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Use a far-future cutoff when forced so all learned verses are included
  const dueCutoff = isForced ? "9999-12-31T00:00:00Z" : new Date().toISOString();

  let query;

  if (verse) {
    query = supabase
      .from("user_verses")
      .select("verse_id, state, stability, difficulty, due_at, reps, lapses, learn_step, verses(id, chapter, verse, text)")
      .eq("user_id", user.id)
      .eq("verse_id", parseInt(verse))
      .in("state", ["review", "mastered", "learning"])
      .limit(1);
  } else if (chapter) {
    query = supabase
      .from("user_verses")
      .select("verse_id, state, stability, difficulty, due_at, reps, lapses, learn_step, verses!inner(id, chapter, verse, text)")
      .eq("user_id", user.id)
      .in("state", ["review", "mastered", "learning"])
      .lte("due_at", dueCutoff)
      .eq("verses.chapter", parseInt(chapter))
      .order("due_at")
      .limit(60); // Acts 7 is the largest chapter at 60 verses
  } else {
    query = supabase
      .from("user_verses")
      .select("verse_id, state, stability, difficulty, due_at, reps, lapses, learn_step, verses(id, chapter, verse, text)")
      .eq("user_id", user.id)
      .in("state", ["review", "mastered", "learning"])
      .lte("due_at", dueCutoff)
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

    // Offer "drill anyway" if user hasn't forced yet and there's a context to force
    const forceHref = !isForced
      ? chapter ? `/drill?chapter=${chapter}&force=true` : `/drill?force=true`
      : null;

    return (
      <div className="bqt-screen" style={{ justifyContent: "center", gap: "var(--s-3)", padding: "0 28px" }}>
        <p className="eyebrow" style={{ color: "var(--leaf-500)" }}>All caught up</p>
        <p className="t-display" style={{ fontSize: 26, textAlign: "center", lineHeight: 1.15 }}>Nothing due right now</p>
        <p style={{ fontSize: 14, color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.5, maxWidth: 300 }}>
          {chapter
            ? `No reviews are scheduled in Acts ${chapter} for today.`
            : "No reviews are scheduled for today."}
          {" "}Drill sessions appear here once you&apos;ve learned verses.
        </p>
        {forceHref && (
          <Link href={forceHref} className="btn btn-ghost btn-md" style={{ marginTop: "var(--s-1)" }}>
            Drill anyway
          </Link>
        )}
        {nextVerse ? (
          <Link
            href={`/learn/${nextVerse.chapter}/${nextVerse.verse}`}
            className="btn btn-saffron btn-lg"
            style={{ marginTop: "var(--s-2)" }}
          >
            Learn Acts {nextVerse.chapter}:{nextVerse.verse} →
          </Link>
        ) : null}
        <Link href="/home" className="btn btn-ghost btn-md">
          Back to home
        </Link>
      </div>
    );
  }

  // Build drill items — mode is assigned client-side from localStorage
  const drillItems = dueVerses.map((uv) => {
    const v = Array.isArray(uv.verses) ? uv.verses[0] : uv.verses;
    return {
      verseId: uv.verse_id,
      chapter: (v as any)?.chapter ?? 0,
      verseNum: (v as any)?.verse ?? 0,
      text: (v as any)?.text ?? "",
      mode: "audio" as const,
      state: uv.state,
    };
  });

  return <DrillClient items={drillItems} />;
}
