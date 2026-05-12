import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/ui/BottomNav";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Icon } from "@/components/ui/Icon";
import { getUserVerseStates, getStreak, getWeeklyReviews, extractVerse } from "@/lib/supabase/queries";

const CHAPTER_COUNTS: Record<number, number> = {
  1: 26, 2: 47, 3: 26, 4: 37, 5: 42, 6: 15, 7: 60, 8: 40, 9: 43,
};
const TOTAL = Object.values(CHAPTER_COUNTS).reduce((a, b) => a + b, 0);

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [userVerses, streak, weekReviews] = await Promise.all([
    getUserVerseStates(supabase, user.id),
    getStreak(supabase, user.id),
    getWeeklyReviews(supabase, user.id),
  ]);

  const masteredCount = userVerses.filter((uv) => uv.state === "mastered").length;
  const reviewCount = userVerses.filter((uv) => uv.state === "review").length;
  const learningCount = userVerses.filter((uv) => uv.state === "learning").length;
  const totalActive = masteredCount + reviewCount;

  const weekAccuracy = weekReviews.length > 0
    ? Math.round((weekReviews.filter((r) => r.grade >= 3).length / weekReviews.length) * 100)
    : 0;

  type ChapterStats = { mastered: number; total: number };
  const chapterStats: Record<number, ChapterStats> = {};
  for (const ch of Object.keys(CHAPTER_COUNTS).map(Number)) {
    chapterStats[ch] = { mastered: 0, total: CHAPTER_COUNTS[ch] };
  }
  for (const uv of userVerses) {
    const ch = extractVerse(uv.verses)?.chapter;
    if (!ch || !chapterStats[ch]) continue;
    if (uv.state === "mastered" || uv.state === "review") chapterStats[ch].mastered++;
  }

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />

      <div style={{ padding: "14px 22px 10px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Acts 1–9 · KJV</div>
        <div className="t-display" style={{ fontSize: 30, lineHeight: 1 }}>Progress</div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px 22px", position: "relative", zIndex: 1 }}>
        {/* streak card */}
        <div className="card" style={{ padding: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--rust-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="flame" size={28} color="#fff" />
          </div>
          <div>
            <div className="t-display" style={{ fontSize: 36, lineHeight: 1, color: "var(--rust-500)" }}>{streak?.current_days ?? 0}</div>
            <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>day streak · best: {streak?.best_days ?? 0}</div>
          </div>
        </div>

        {/* overall progress */}
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>overall mastery</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
            <span className="t-display" style={{ fontSize: 48, lineHeight: 1 }}>{totalActive}</span>
            <span style={{ fontSize: 16, color: "var(--ink-muted)" }}>/ {TOTAL}</span>
          </div>
          <ProgressBar value={totalActive / TOTAL} height={10} />
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            {[
              ["mastered", masteredCount, "var(--leaf-500)"],
              ["in review", reviewCount, "var(--saffron-500)"],
              ["learning", learningCount, "var(--hm-learning)"],
            ].map(([l, v, c]) => (
              <div key={String(l)}>
                <div className="t-display" style={{ fontSize: 20, color: String(c) }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* weekly stats */}
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>this week</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div className="t-display" style={{ fontSize: 32, lineHeight: 1 }}>{weekReviews.length}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>reviews</div>
            </div>
            <div>
              <div className="t-display" style={{ fontSize: 32, lineHeight: 1, color: weekAccuracy >= 80 ? "var(--leaf-500)" : "var(--ink)" }}>
                {weekAccuracy}%
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>recall rate</div>
            </div>
          </div>
        </div>

        {/* chapter breakdown */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>by chapter</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(chapterStats).map(([ch, { mastered, total }]) => (
              <div key={ch}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Acts {ch}</span>
                  <span className="t-mono" style={{ fontSize: 12, color: "var(--ink-muted)" }}>{mastered}/{total}</span>
                </div>
                <ProgressBar value={mastered / total} height={6} accent={mastered === total ? "var(--leaf-500)" : "var(--saffron-500)"} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="progress" />
    </div>
  );
}
