import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DrillClient } from "./DrillClient";
import { getDueVerses, getNextNewVerse, extractVerse } from "@/lib/supabase/queries";

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

  const dueVerses = await getDueVerses(supabase, user.id, {
    chapter: chapter ? parseInt(chapter) : undefined,
    verseId: verse ? parseInt(verse) : undefined,
    isForced,
  });

  if (dueVerses.length === 0) {
    const nextNew = await getNextNewVerse(supabase, user.id);

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
        {nextNew ? (
          <Link
            href={`/learn/${nextNew.chapter}/${nextNew.verse}`}
            className="btn btn-saffron btn-lg"
            style={{ marginTop: "var(--s-2)" }}
          >
            Learn Acts {nextNew.chapter}:{nextNew.verse} →
          </Link>
        ) : null}
        <Link href="/home" className="btn btn-ghost btn-md">
          Back to home
        </Link>
      </div>
    );
  }

  const drillItems = dueVerses.map((uv) => {
    const v = extractVerse(uv.verses);
    return {
      verseId: uv.verse_id,
      book: v?.book ?? "Acts",
      chapter: v?.chapter ?? 0,
      verseNum: v?.verse ?? 0,
      text: v?.text ?? "",
      state: uv.state,
    };
  });

  return <DrillClient items={drillItems} />;
}
