import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mark } from "@/components/ui/Mark";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { HMCell } from "@/components/ui/HMCell";
import { BottomNav } from "@/components/ui/BottomNav";
import type { VerseState } from "@/lib/supabase/types";
import { getUserVerseStates, getStreak, getWeeklyReviews, getActiveBook, getBookChapterCounts, getProfile } from "@/lib/supabase/queries";
import { getNextEvent, getReadinessSummary, getDaysUntil, isEventUpcoming } from "@/lib/events";
import { deriveVerseProgress, allocateDrillModes, findNextLearnVerse, calculateRecallRate } from "@/lib/home";

const MINI_BAR_STATES: VerseState[] = ["mastered", "review", "learning", "new", "stale"];
const MINI_BAR_COLORS: Record<VerseState, string> = {
  mastered: "var(--hm-mastered)",
  review: "var(--hm-review)",
  learning: "var(--hm-learning)",
  new: "var(--hm-new)",
  stale: "var(--hm-stale)",
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Initialize user_verses rows on first visit (idempotent — safe to call every load)
  await supabase.rpc("ensure_user_verses", { p_user_id: user.id });

  const [userVerses, streak, weekReviews, nextEvent, activeBook, profile] = await Promise.all([
    getUserVerseStates(supabase, user.id),
    getStreak(supabase, user.id),
    getWeeklyReviews(supabase, user.id),
    getNextEvent(supabase, user.id),
    getActiveBook(supabase, user.id),
    getProfile(supabase, user.id),
  ]);

  if (!profile) redirect("/onboarding");

  const CHAPTER_COUNTS = await getBookChapterCounts(supabase, activeBook);
  const TOTAL_VERSES = Object.values(CHAPTER_COUNTS).reduce((a, b) => a + b, 0);
  const chapters = Object.keys(CHAPTER_COUNTS).map(Number).sort((a, b) => a - b);
  const chapterRange = chapters.length > 0 ? `${chapters[0]}–${chapters[chapters.length - 1]}` : "";

  const upcomingEvent = nextEvent && isEventUpcoming(nextEvent) ? nextEvent : null;
  const readiness = upcomingEvent
    ? await getReadinessSummary(supabase, user.id, upcomingEvent)
    : null;

  const { verseMap, dueCount, masteredCount } = deriveVerseProgress(userVerses);
  const drillModes = allocateDrillModes(dueCount);
  const recallRate = calculateRecallRate(weekReviews);
  const nextLearn = findNextLearnVerse(verseMap, CHAPTER_COUNTS);
  const nextLearnChapter = nextLearn?.chapter ?? null;
  const nextLearnVerse = nextLearn?.verse ?? null;
  const totalReviews = weekReviews.length;

  // Active chapter for rail highlight: first chapter with any due verse
  const now = new Date();
  const activeChapter = (() => {
    for (const ch of chapters) {
      const hasDue = userVerses.some(uv => {
        const ref = Array.isArray(uv.verses) ? uv.verses[0] : uv.verses;
        return ref?.chapter === ch && uv.due_at && new Date(uv.due_at) <= now && uv.state !== "new";
      });
      if (hasDue) return ch;
    }
    return chapters[0] ?? null;
  })();

  const displayName = profile?.full_name ?? "Quizzer";
  const avatarInitial = displayName[0]?.toUpperCase() ?? "Q";

  return (
    <div className="bqt-screen bqt-screen--wide">
      <div className="paper-grain" />

      <div className="home-layout">
        {/* ── Left rail (≥768px only) ──────────────────────────────── */}
        <aside className="home-rail">
          {/* Logo + wordmark */}
          <div style={{ padding: "18px 16px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <Mark size={24} />
            <span className="t-display" style={{ fontSize: 16, lineHeight: 1, letterSpacing: "-0.01em" }}>
              Bible Quiz Trainer
            </span>
          </div>

          {/* Chapter list */}
          <div className="home-rail__scroll">
            {chapters.map(ch => {
              const count = CHAPTER_COUNTS[ch];
              const verses = Array.from({ length: count }, (_, i) => verseMap[ch]?.[i + 1] ?? "new");
              const isActive = ch === activeChapter;
              const stateCounts = MINI_BAR_STATES.reduce<Record<VerseState, number>>((acc, s) => {
                acc[s] = verses.filter(v => v === s).length;
                return acc;
              }, { mastered: 0, review: 0, learning: 0, new: 0, stale: 0 });
              const filled = MINI_BAR_STATES.filter(s => stateCounts[s] > 0);

              return (
                <Link
                  key={ch}
                  href={`/chapter/${ch}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 16px",
                    textDecoration: "none",
                    color: isActive ? "#fff" : "var(--ink)",
                    background: isActive ? "var(--ink)" : "transparent",
                  }}
                >
                  <div style={{ minWidth: 36 }}>
                    <div className="t-display" style={{ fontSize: 16, lineHeight: 1 }}>Ch. {ch}</div>
                    <div className="t-mono" style={{ fontSize: 9, color: isActive ? "rgba(255,255,255,0.55)" : "var(--ink-muted)" }}>{count}v</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", background: isActive ? "rgba(255,255,255,0.15)" : "var(--hairline)" }}>
                      {filled.map(s => (
                        <div key={s} style={{ flex: stateCounts[s], background: MINI_BAR_COLORS[s] }} />
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User row */}
          <div style={{ padding: "14px 16px", borderTop: "1px solid var(--hairline)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--saffron-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="t-display" style={{ fontSize: 14, color: "#fff", lineHeight: 1 }}>{avatarInitial}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
              <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>{streak?.current_days ?? 0} day streak</div>
            </div>
            <Link href="/settings" style={{ color: "var(--ink-muted)", flexShrink: 0 }}>
              <Icon name="tune" size={18} color="var(--ink-muted)" />
            </Link>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="home-main">
          {/* Mobile header — hidden on wide (rail provides logo + nav) */}
          <div className="home-mobile-header" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 22px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Mark size={28} />
              <span className="t-display" style={{ fontSize: 19, lineHeight: 1, letterSpacing: "-0.01em" }}>
                Bible Quiz Trainer
              </span>
            </div>
            {upcomingEvent ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 8px", background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: 999 }}>
                <Icon name="calendar" size={14} color="var(--saffron-500)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{getDaysUntil(upcomingEvent)} days</span>
                <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>· {upcomingEvent.name}</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 8px", background: "var(--paper)", border: "1px solid var(--hairline)", borderRadius: 999 }}>
                <Icon name="flame" size={14} color="var(--rust-500)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{streak?.current_days ?? 0}</span>
                <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>days</span>
              </div>
            )}
          </div>

          <div style={{ padding: "0 22px 22px", position: "relative", zIndex: 1 }}>
            {/* hero */}
            <div style={{ marginBottom: 18 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>{activeBook} {chapterRange} · KJV</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <h1 className="t-display" style={{ fontSize: 54, lineHeight: 0.95, margin: 0, fontWeight: 400 }}>{activeBook}</h1>
                <div style={{ textAlign: "right" }}>
                  <div className="t-mono" style={{ fontSize: 13, color: "var(--ink-muted)" }}>{masteredCount} / {TOTAL_VERSES}</div>
                  <div className="eyebrow" style={{ marginTop: 2 }}>memorized</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={masteredCount / TOTAL_VERSES} />
              </div>
            </div>

            {/* CTA + wide stats card grid */}
            <div className="home-card-grid" style={{ marginBottom: 22 }}>
              {/* Today's review CTA */}
              <div>
                {dueCount > 0 ? (
                  <div className="card" style={{ padding: 18, background: "var(--ink)", color: "#fff", border: "none", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: -20, top: -10, fontFamily: "var(--font-display)", fontSize: 180, fontStyle: "italic", color: "var(--saffron-500)", opacity: 0.18, lineHeight: 1, pointerEvents: "none" }}>α</div>
                    <div style={{ position: "relative" }}>
                      <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 6 }}>Today&apos;s review</div>
                      <div className="t-display" style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 500, marginBottom: 4 }}>{dueCount} verses due</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>~{Math.ceil(dueCount * 0.6)} min · mixed drill modes</div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
                        {drillModes.map(([k, n]) => (
                          <div key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12 }}>
                            <span style={{ color: "rgba(255,255,255,0.7)" }}>{k}</span>
                            <span className="t-mono" style={{ color: "var(--saffron-300)" }}>{n}</span>
                          </div>
                        ))}
                      </div>
                      <Link href="/drill" className="btn btn-saffron btn-lg" style={{ width: "100%", display: "flex" }}>
                        Start review <Icon name="chevron-right" size={18} color="#fff" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <div className="eyebrow" style={{ marginBottom: 6, color: "var(--leaf-500)" }}>All caught up</div>
                      <div className="t-display" style={{ fontSize: 22, lineHeight: 1.05, marginBottom: 4 }}>No reviews due</div>
                      <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0, lineHeight: 1.5 }}>
                        Your schedule is clear. Use this time to push forward on new material or sharpen what you already know.
                      </p>
                    </div>
                    {masteredCount > 0 && (
                      <Link href="/drill?force=true" className="btn btn-saffron btn-lg" style={{ display: "flex", width: "100%" }}>
                        Practice what you know <Icon name="chevron-right" size={18} color="#fff" />
                      </Link>
                    )}
                    {nextLearnChapter && nextLearnVerse && (
                      <Link href={`/learn/${nextLearnChapter}/${nextLearnVerse}`} className="btn btn-ghost btn-lg" style={{ display: "flex", width: "100%" }}>
                        Learn next verse <Icon name="chevron-right" size={18} color="var(--ink)" />
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Stats card — wide only */}
              <div className="home-wide-only card" style={{ padding: 18 }}>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Stats</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Recall rate</span>
                    <span className="t-display" style={{ fontSize: 20, color: "var(--ink)" }}>{recallRate}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Memorized</span>
                    <span className="t-display" style={{ fontSize: 20, color: "var(--leaf-500)" }}>{masteredCount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Streak</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="flame" size={14} color="var(--rust-500)" />
                      <span className="t-display" style={{ fontSize: 20, color: "var(--ink)" }}>{streak?.current_days ?? 0}</span>
                    </div>
                  </div>
                  {nextLearnChapter && nextLearnVerse && (
                    <Link href={`/learn/${nextLearnChapter}/${nextLearnVerse}`} style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 10, borderTop: "1px solid var(--hairline)", textDecoration: "none", color: "inherit" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--saffron-50)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid var(--saffron-100)", flexShrink: 0 }}>
                        <div className="t-mono" style={{ fontSize: 8, color: "var(--saffron-700)" }}>{activeBook.toUpperCase()}</div>
                        <div className="t-display" style={{ fontSize: 14, lineHeight: 1, color: "var(--saffron-700)" }}>{nextLearnChapter}:{nextLearnVerse}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginBottom: 1 }}>Up next to learn</div>
                        <div className="t-display-italic" style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.3 }}>Ch. {nextLearnChapter} · verse {nextLearnVerse}</div>
                      </div>
                      <Icon name="chevron-right" size={16} color="var(--ink-muted)" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Up next to learn — mobile only */}
            {nextLearnChapter && nextLearnVerse && (
              <div className="home-mobile-only" style={{ marginBottom: 22 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>Up next to learn</div>
                <Link href={`/learn/${nextLearnChapter}/${nextLearnVerse}`} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "inherit" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--saffron-50)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid var(--saffron-100)", flexShrink: 0 }}>
                    <div className="t-mono" style={{ fontSize: 9, color: "var(--saffron-700)", letterSpacing: "0.08em" }}>{activeBook.toUpperCase()}</div>
                    <div className="t-display" style={{ fontSize: 18, lineHeight: 1, color: "var(--saffron-700)" }}>{nextLearnChapter}:{nextLearnVerse}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-display-italic" style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.35 }}>First verse in {activeBook} {nextLearnChapter}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>~2 min · 5 steps</div>
                  </div>
                  <Icon name="chevron-right" size={18} color="var(--ink-muted)" />
                </Link>
              </div>
            )}

            {/* readiness card — only when event is within 60 days */}
            {upcomingEvent && readiness && (
              <div className="card" style={{ padding: 18, marginBottom: 22 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Next event</div>
                <div className="t-display" style={{ fontSize: 20, lineHeight: 1.1, marginBottom: 2 }}>{upcomingEvent.name}</div>
                <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 14 }}>
                  {new Date(upcomingEvent.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  {" · "}Ch. 1–{upcomingEvent.end_chapter}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-muted)", marginBottom: 6 }}>
                    <span>{readiness.mastered} of {readiness.inScope} verses ready</span>
                    <span className="t-mono">{readiness.inScope > 0 ? Math.round((readiness.mastered / readiness.inScope) * 100) : 0}%</span>
                  </div>
                  <ProgressBar value={readiness.inScope > 0 ? readiness.mastered / readiness.inScope : 0} />
                </div>
                <Link href={`/drill?chapter=${upcomingEvent.end_chapter}`} className="btn btn-saffron" style={{ marginTop: 14, display: "flex", width: "100%" }}>
                  Drill for next event <Icon name="chevron-right" size={16} color="#fff" />
                </Link>
              </div>
            )}

            {/* heatmap by chapter */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                <div className="eyebrow">Mastery · by verse</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10, color: "var(--ink-muted)" }}>
                  {(["new", "learning", "review", "mastered"] as VerseState[]).map((l) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <div className={`hm-cell lvl-${l}`} style={{ width: 9, height: 9 }} />
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(CHAPTER_COUNTS).map(([chStr, count]) => {
                  const ch = Number(chStr);
                  const verses = Array.from({ length: count }, (_, i) => verseMap[ch]?.[i + 1] ?? "new");
                  const mastered = verses.filter((v) => v === "mastered" || v === "review").length;
                  const pct = Math.round((mastered / count) * 100);
                  return (
                    <Link key={ch} href={`/chapter/${ch}`} className="hm-row" style={{ textDecoration: "none", color: "inherit" }}>
                      <div>
                        <div className="t-display" style={{ fontSize: 18, lineHeight: 1 }}>Ch. {ch}</div>
                        <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>{count}v</div>
                      </div>
                      <div className="hm-grid">
                        {verses.map((lvl, vi) => (
                          <HMCell key={vi} level={lvl} label={`${ch}:${vi + 1}`} />
                        ))}
                        {/* Placeholders — extra cells are ignored by the grid */}
                      </div>
                      <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "right" }}>{pct}%</div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* stats strip — mobile only */}
            <div className="home-mobile-only card" style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {[
                [recallRate + "%", "recall rate", false],
                [totalReviews + "", "this week", false],
                [masteredCount + "", "memorized", true],
              ].map(([v, l, green], i) => (
                <div key={String(l)} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid var(--hairline)" : "none" }}>
                  <div className="t-display" style={{ fontSize: 22, lineHeight: 1, color: green ? "var(--leaf-500)" : "var(--ink)" }}>{v}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav — hidden on wide home (rail provides chapter navigation) */}
      <div className="home-bottom-nav">
        <BottomNav active="home" bookName={activeBook} />
      </div>
    </div>
  );
}
