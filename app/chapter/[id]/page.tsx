import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { HMCell } from "@/components/ui/HMCell";
import type { VerseState } from "@/lib/supabase/types";

const CHAPTER_COUNTS: Record<number, number> = {
  1: 26, 2: 47, 3: 26, 4: 37, 5: 42, 6: 15, 7: 60, 8: 40, 9: 43,
};

export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ch = parseInt(id);
  if (!CHAPTER_COUNTS[ch]) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Fetch verses + user state for this chapter
  const { data: rows } = await supabase
    .from("verses")
    .select("id, verse, text, user_verses(state, learn_step, due_at, stability)")
    .eq("chapter", ch)
    .eq("book", "Acts")
    .eq("translation", "KJV")
    .eq("user_verses.user_id", user.id)
    .order("verse");

  if (!rows || rows.length === 0) {
    // Verses not seeded yet — show a helpful message
    return (
      <div className="bqt-screen" style={{ justifyContent: "center", alignItems: "center", padding: 32 }}>
        <div style={{ textAlign: "center" }}>
          <div className="t-display" style={{ fontSize: 22, marginBottom: 8 }}>No verses loaded</div>
          <p style={{ fontSize: 14, color: "var(--ink-muted)" }}>Run <code>npm run seed</code> to load the KJV text.</p>
          <Link href="/home" className="btn btn-ghost btn-md" style={{ marginTop: 16, display: "inline-flex" }}>← Back home</Link>
        </div>
      </div>
    );
  }

  type Row = typeof rows[number];
  const getState = (row: Row): VerseState => {
    const uv = Array.isArray(row.user_verses) ? row.user_verses[0] : row.user_verses;
    return (uv?.state as VerseState) ?? "new";
  };

  const now = new Date();
  const getDue = (row: Row): string | null => {
    const uv = Array.isArray(row.user_verses) ? row.user_verses[0] : row.user_verses;
    return uv?.due_at ?? null;
  };
  const getStep = (row: Row): number => {
    const uv = Array.isArray(row.user_verses) ? row.user_verses[0] : row.user_verses;
    return uv?.learn_step ?? 0;
  };

  const dueTodayCount = rows.filter((r) => {
    const due = getDue(r);
    return due && new Date(due) <= now && getState(r) !== "new";
  }).length;
  const masteredCount = rows.filter((r) => getState(r) === "mastered").length;
  const learningCount = rows.filter((r) => getState(r) === "learning").length;
  const newCount = rows.filter((r) => getState(r) === "new").length;

  // Find first unlearned verse
  const firstNew = rows.find((r) => getState(r) === "new");

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />

      {/* header */}
      <div style={{ position: "relative", zIndex: 1, padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 14 }}>
        <Link href="/home" style={{ lineHeight: 0, color: "var(--ink)" }}>
          <Icon name="chevron-left" size={22} color="var(--ink)" />
        </Link>
        <div style={{ flex: 1 }}>
          <div className="eyebrow">Acts · KJV</div>
          <div className="t-display" style={{ fontSize: 22, lineHeight: 1 }}>Chapter {ch}</div>
        </div>
      </div>

      {/* chips */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 22px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {dueTodayCount > 0 && (
          <div className="chip" style={{ background: "var(--ink)", color: "#fff", borderColor: "var(--ink)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--saffron-300)", flexShrink: 0 }} />
            <span>{dueTodayCount} due today</span>
          </div>
        )}
        {masteredCount > 0 && (
          <div className="chip">
            <div className="hm-cell lvl-mastered" style={{ width: 8, height: 8 }} />
            <span>{masteredCount} mastered</span>
          </div>
        )}
        {learningCount > 0 && (
          <div className="chip">
            <div className="hm-cell lvl-learning" style={{ width: 8, height: 8 }} />
            <span>{learningCount} learning</span>
          </div>
        )}
        {newCount > 0 && (
          <div className="chip">
            <div className="hm-cell lvl-new" style={{ width: 8, height: 8 }} />
            <span>{newCount} new</span>
          </div>
        )}
      </div>

      {/* verse list */}
      <div className="screen-scroll" style={{ padding: "0 22px 22px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((row) => {
            const state = getState(row);
            const step = getStep(row);
            const due = getDue(row);
            const isDue = due && new Date(due) <= now && state !== "new";

            return (
              <Link key={row.verse} href={`/learn/${ch}/${row.verse}`} className="card" style={{
                padding: "12px 14px",
                display: "grid",
                gridTemplateColumns: "40px 1fr 14px",
                gap: 12,
                alignItems: "flex-start",
                textDecoration: "none",
                color: "inherit",
                boxShadow: isDue ? "var(--sh-2)" : "var(--sh-1)",
              }}>
                {/* verse # + mastery bar */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2 }}>
                  <div className="t-display" style={{ fontSize: 22, lineHeight: 1, color: state === "mastered" ? "var(--leaf-500)" : "var(--ink)" }}>
                    {row.verse}
                  </div>
                  <div className={`hm-cell lvl-${state}`} style={{ width: 18, height: 4, borderRadius: 2 }} />
                </div>

                {/* text preview */}
                <div style={{ minWidth: 0 }}>
                  <div className="t-display" style={{
                    fontSize: 14.5,
                    lineHeight: 1.45,
                    color: "var(--ink)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    fontWeight: 400,
                  }}>
                    {row.text}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6, alignItems: "center" }}>
                    <span className="t-mono" style={{ fontSize: 10, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {state}
                    </span>
                    {state === "review" || state === "mastered" ? (
                      due && <span className="t-mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>
                        next · {Math.max(0, Math.round((new Date(due).getTime() - Date.now()) / 86_400_000))}d
                      </span>
                    ) : state === "new" ? (
                      <span style={{ fontSize: 10, color: "var(--saffron-700)", fontWeight: 600 }}>learn now →</span>
                    ) : (
                      <span className="t-mono" style={{ fontSize: 10, color: "var(--saffron-700)" }}>
                        step {step + 1} / 5
                      </span>
                    )}
                  </div>
                </div>

                <Icon name="chevron-right" size={14} color="var(--ink-muted)" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* bottom CTA */}
      <div className="bottom-bar" style={{ padding: "14px 22px 28px", display: "flex", gap: 10 }}>
        {firstNew && (
          <Link href={`/learn/${ch}/${firstNew.verse}`} className="btn btn-ghost btn-md" style={{ flex: 1, display: "flex" }}>
            <Icon name="list" size={16} color="var(--ink)" />
            Learn next
          </Link>
        )}
        <Link href={`/drill?chapter=${ch}&force=true`} className="btn btn-primary btn-md" style={{ flex: 1.4, display: "flex" }}>
          Drill chapter {ch}
          <Icon name="chevron-right" size={16} color="var(--bg)" />
        </Link>
      </div>
    </div>
  );
}
