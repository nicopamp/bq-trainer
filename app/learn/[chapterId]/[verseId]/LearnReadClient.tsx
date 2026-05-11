"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { LearnStepHeader } from "@/components/ui/LearnStepHeader";
import { chunkVerse } from "@/lib/chunking";
import { advanceLearnStep } from "@/lib/actions";

interface Props {
  verseId: number;
  chapter: number;
  verseNum: number;
  text: string;
  initialStep: 0 | 1 | 2 | 3 | 4;
}

export function LearnReadClient({ verseId, chapter, verseNum, text, initialStep }: Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(initialStep);
  const [graduated, setGraduated] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const vref = `${chapter}:${verseNum}`;
  const backHref = `/chapter/${chapter}`;
  const chunks = chunkVerse(text);

  const advance = useCallback(async (nextStep: number) => {
    setSaving(true);
    await advanceLearnStep(verseId, nextStep);
    setSaving(false);
    if (nextStep >= 5) {
      setGraduated(true);
    } else {
      setStep(nextStep as 0 | 1 | 2 | 3 | 4);
    }
  }, [verseId]);

  if (graduated) return <GraduateStep vref={vref} chapter={chapter} />;

  switch (step) {
    case 0: return <ReadStep text={text} vref={vref} backHref={backHref} onNext={() => advance(1)} saving={saving} />;
    case 1: return <ChunkStep text={text} chunks={chunks} vref={vref} backHref={backHref} onNext={() => advance(2)} saving={saving} />;
    case 2: return <TraceStep text={text} vref={vref} backHref={backHref} onNext={() => advance(3)} saving={saving} />;
    case 3: return <RecallStep text={text} vref={vref} backHref={backHref} onNext={() => advance(5)} saving={saving} />;
    default: return <GraduateStep vref={vref} chapter={chapter} />;
  }
}

// ── Step 0: Read ──────────────────────────────────────────────────
function ReadStep({ text, vref, backHref, onNext, saving }: {
  text: string; vref: string; backHref: string; onNext: () => void; saving: boolean;
}) {
  const speak = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      <LearnStepHeader step={0} title="Meet the verse" vref={vref} backHref={backHref} />

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div style={{ position: "relative", padding: "40px 8px 24px" }}>
          <div style={{ position: "absolute", top: -10, left: -2, fontFamily: "var(--font-display)", fontSize: 110, lineHeight: 1, color: "var(--saffron-300)", fontStyle: "italic", opacity: 0.65, pointerEvents: "none" }}>"</div>
          <div className="t-display" style={{ fontSize: 24, lineHeight: 1.45, fontWeight: 400, color: "var(--ink)", position: "relative", zIndex: 1 }}>
            {text}
          </div>
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
            <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-muted)", letterSpacing: "0.1em" }}>ACTS {vref} · KJV</div>
            <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
          <button className="btn btn-primary btn-md" style={{ flex: 1 }} onClick={speak}>
            <Icon name="play" size={14} color="var(--bg)" />
            Listen
          </button>
        </div>
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px" }}>
        <button className="btn btn-saffron btn-lg" style={{ width: "100%" }} onClick={onNext} disabled={saving}>
          {saving ? "Saving…" : "I've read it — chunk it up"}
          <Icon name="chevron-right" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Chunk ─────────────────────────────────────────────────
function ChunkStep({ text, chunks, vref, backHref, onNext, saving }: {
  text: string; chunks: string[]; vref: string; backHref: string; onNext: () => void; saving: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  const speak = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(chunks.slice(0, activeIdx + 1).join(" "));
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleGotIt = () => {
    if (activeIdx < chunks.length - 1) {
      setActiveIdx(activeIdx + 1);
    } else {
      onNext();
    }
  };

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      <LearnStepHeader step={1} title="Build it phrase by phrase" vref={vref} backHref={backHref} />

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div className="card" style={{ padding: "20px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="eyebrow">phrase {activeIdx + 1} of {chunks.length}</div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>say all so far →</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {chunks.map((phrase, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              const upcoming = i > activeIdx;
              return (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ paddingTop: 7, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: 6, flexShrink: 0,
                      background: done ? "var(--leaf-500)" : active ? "var(--saffron-500)" : "transparent",
                      border: upcoming ? "1.4px solid var(--hairline)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {done && <Icon name="check" size={8} color="#fff" strokeWidth={2.4} />}
                    </div>
                    {i < chunks.length - 1 && (
                      <div style={{ width: 1.4, flex: 1, minHeight: 14, background: done ? "var(--leaf-500)" : "var(--hairline)", opacity: done ? 0.5 : 1 }} />
                    )}
                  </div>
                  <div style={{
                    flex: 1, fontFamily: "var(--font-display)", fontWeight: active ? 500 : 400,
                    fontSize: active ? 22 : 17, lineHeight: 1.35, color: "var(--ink)",
                    opacity: upcoming ? 0.28 : done ? 0.6 : 1,
                    background: active ? "linear-gradient(180deg, var(--saffron-50) 0%, transparent 100%)" : "transparent",
                    borderLeft: active ? "3px solid var(--saffron-500)" : "none",
                    padding: active ? "6px 12px" : "4px 0",
                    marginLeft: active ? -8 : 0,
                    borderRadius: active ? "var(--r-sm)" : 0,
                  }}>
                    {phrase}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, padding: "12px 14px", background: "var(--saffron-50)", borderRadius: "var(--r-md)", border: "1px solid var(--saffron-100)" }}>
          <Icon name="sparkles" size={16} color="var(--saffron-700)" />
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ink-soft)" }}>
            <span style={{ fontWeight: 600, color: "var(--saffron-700)" }}>Cumulative chunking · </span>
            recite every phrase before the next is added — the proven way to lock in word order.
          </div>
        </div>
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, fontSize: 12, color: "var(--ink-soft)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--leaf-500)", boxShadow: "0 0 0 4px rgba(91,110,79,.18)" }} />
          listening · read the highlighted phrase aloud
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-lg" style={{ width: 56, padding: 0 }} onClick={speak}>
            <Icon name="volume" size={18} color="var(--ink)" />
          </button>
          <button className="btn btn-saffron btn-lg" style={{ flex: 1 }} onClick={handleGotIt} disabled={saving}>
            {activeIdx < chunks.length - 1 ? "Got it" : (saving ? "Saving…" : "Got it all")}
            <Icon name="chevron-right" size={18} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Trace ─────────────────────────────────────────────────
function TraceStep({ text, vref, backHref, onNext, saving }: {
  text: string; vref: string; backHref: string; onNext: () => void; saving: boolean;
}) {
  const [revealLevel, setRevealLevel] = useState(0); // 0=first-letter, 1=half, 2=full
  const words = text.replace(/[.!?]$/, "").split(" ");

  const speak = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      <LearnStepHeader step={2} title="Just the first letters" vref={vref} backHref={backHref} />

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div className="card" style={{ padding: "22px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="eyebrow">trace mode</div>
            <div className="chip chip-mono">first-letter</div>
          </div>

          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.8, color: "var(--ink)" }}>
            {words.map((w, i) => {
              const showFull = revealLevel >= 2;
              const showHalf = revealLevel >= 1;
              const visibleChars = showFull ? w.length : showHalf ? Math.ceil(w.length / 2) : 1;
              return (
                <span key={i} style={{ display: "inline-block", marginRight: 10 }}>
                  <span style={{ fontWeight: 500 }}>{w.slice(0, visibleChars)}</span>
                  {visibleChars < w.length && (
                    <span style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 1 }}>
                      <span style={{ display: "inline-block", borderBottom: "1.4px solid var(--hairline)", width: Math.max(8, (w.length - visibleChars) * 7), height: 1 }} />
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* reveal slider */}
          <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid var(--hairline)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="eyebrow">reveal</div>
              <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                {revealLevel === 0 ? "first-letter" : revealLevel === 1 ? "half" : "full"}
              </div>
            </div>
            <input
              type="range" min={0} max={2} step={1} value={revealLevel}
              onChange={(e) => setRevealLevel(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--saffron-500)" }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8, padding: "12px 14px", background: "var(--saffron-50)", borderRadius: "var(--r-md)", border: "1px solid var(--saffron-100)" }}>
          <Icon name="sparkles" size={16} color="var(--saffron-700)" />
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "var(--ink-soft)" }}>
            Recite the verse aloud — the letters are a scaffold. Slide left for less help.
          </div>
        </div>
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px", display: "flex", gap: 10 }}>
        <button className="btn btn-ghost btn-lg" style={{ width: 56, padding: 0 }} onClick={speak}>
          <Icon name="volume" size={18} color="var(--ink)" />
        </button>
        <button className="btn btn-saffron btn-lg" style={{ flex: 1 }} onClick={onNext} disabled={saving}>
          {saving ? "Saving…" : "Got it — try cold recall"}
          <Icon name="chevron-right" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Recall ────────────────────────────────────────────────
function RecallStep({ text, vref, backHref, onNext, saving }: {
  text: string; vref: string; backHref: string; onNext: () => void; saving: boolean;
}) {
  const [passes, setPasses] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [listening, setListening] = useState(false);

  const PASSES_NEEDED = 3;

  const handlePass = () => {
    const next = passes + 1;
    setPasses(next);
    if (next >= PASSES_NEEDED) {
      onNext();
    }
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      // fallback: just mark as pass
      handlePass();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    setListening(true);

    rec.onresult = (e: any) => {
      const said = e.results[0][0].transcript.toLowerCase();
      const target = text.toLowerCase().replace(/[^\w\s]/g, "");
      const targetWords = target.split(/\s+/);
      const saidWords = said.split(/\s+/);
      const matches = saidWords.filter((w: string) => targetWords.includes(w)).length;
      const accuracy = matches / targetWords.length;
      if (accuracy >= 0.75) handlePass();
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      <LearnStepHeader step={3} title="From memory — no help" vref={vref} backHref={backHref} />

      <div className="screen-scroll" style={{ padding: "0 22px", flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        {/* lined card */}
        <div className="card" style={{
          padding: "40px 20px",
          flex: 1, minHeight: 240,
          background: "repeating-linear-gradient(transparent 0px, transparent 31px, var(--hairline) 31px, var(--hairline) 32px)",
          backgroundPosition: "0 16px",
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6, pointerEvents: "none" }}>
            {revealed ? (
              <div className="t-display" style={{ fontSize: 18, lineHeight: 1.4, color: "var(--ink)", textAlign: "center", padding: "0 20px" }}>{text}</div>
            ) : (
              <>
                <div className="t-display-italic" style={{ fontSize: 48, color: "var(--saffron-100)", fontWeight: 400 }}>{vref}</div>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--ink-muted)", letterSpacing: "0.15em" }}>recall the whole verse</div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: "var(--ink-muted)", fontStyle: "italic" }}>
          {passes < PASSES_NEEDED
            ? `Recite the full verse aloud — ${PASSES_NEEDED - passes} more pass${PASSES_NEEDED - passes === 1 ? "" : "es"} to graduate.`
            : "You've got it!"}
        </div>

        {/* attempt counter */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 10 }}>
          {Array.from({ length: PASSES_NEEDED }, (_, i) => {
            const state = i < passes ? "pass" : i === passes ? "active" : "pending";
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999,
                background: state === "pass" ? "var(--leaf-500)" : state === "active" ? "var(--paper)" : "var(--bg-deep)",
                border: state === "active" ? "1.4px solid var(--saffron-500)" : "1px solid transparent",
                color: state === "pass" ? "#fff" : "var(--ink)",
                fontSize: 12, fontWeight: 600,
              }}>
                {state === "pass" && <Icon name="check" size={11} color="#fff" strokeWidth={2.4} />}
                Pass {i + 1}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bottom-bar" style={{ padding: "20px 22px 28px", display: "flex", gap: 12, alignItems: "center" }}>
        <button className="btn btn-ghost btn-md" style={{ width: 50, padding: 0 }} onClick={() => setRevealed(!revealed)}>
          <Icon name={revealed ? "eye-off" : "eye"} size={16} color="var(--ink)" />
        </button>
        <button
          style={{
            flex: 1, height: 64, borderRadius: 32, border: "none", cursor: "pointer",
            background: listening ? "var(--leaf-500)" : "var(--rust-500)",
            boxShadow: "0 8px 24px rgba(168,69,31,.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#fff",
          }}
          onClick={startListening}
          disabled={saving}
        >
          <Icon name="mic-fill" size={20} color="#fff" />
          <span className="t-display" style={{ fontSize: 16, fontWeight: 500 }}>
            {listening ? "Listening…" : saving ? "Saving…" : "Tap when ready"}
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Graduate ──────────────────────────────────────────────
function GraduateStep({ vref, chapter }: { vref: string; chapter: number }) {
  const router = useRouter();

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      <div style={{ padding: "10px 22px 0", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ flex: 1, display: "flex", gap: 4 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--leaf-500)" }} />
            ))}
          </div>
        </div>
        <div className="eyebrow" style={{ color: "var(--saffron-700)" }}>verse graduated</div>
        <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>Graduated</div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
        {/* badge */}
        <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
          <div style={{
            width: 120, height: 120, margin: "0 auto", borderRadius: 60,
            background: "radial-gradient(circle at 50% 35%, var(--saffron-300), var(--saffron-500))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 32px rgba(201,132,44,.35), inset 0 -4px 0 rgba(0,0,0,.08)",
            position: "relative",
          }}>
            <div className="t-display-italic" style={{ fontSize: 48, color: "#fff", fontWeight: 500, textShadow: "0 2px 6px rgba(0,0,0,.15)" }}>
              {vref}
            </div>
            <div style={{ position: "absolute", top: -4, right: 6 }}>
              <Icon name="sparkles" size={22} color="var(--saffron-300)" />
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
          <div className="t-display" style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 500 }}>It&apos;s in your bones.</div>
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8, maxWidth: 290, marginLeft: "auto", marginRight: "auto", lineHeight: 1.4 }}>
            Acts {vref} joins your review pool. You&apos;ll see it again at the right moments.
          </div>
        </div>

        {/* SRS schedule preview */}
        <div className="card" style={{ marginTop: 22, padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>your upcoming reviews</div>
          <div style={{ position: "relative", height: 80 }}>
            <div style={{ position: "absolute", left: 6, right: 6, top: 32, height: 2, background: "var(--bg-deep)", borderRadius: 1 }} />
            {[{ d: "now", pos: 0 }, { d: "+1d", pos: 22 }, { d: "+4d", pos: 44 }, { d: "+12d", pos: 68 }, { d: "+32d", pos: 100 }].map((p, i) => (
              <div key={i} style={{ position: "absolute", left: `${p.pos}%`, top: 0, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-muted)", marginBottom: 4 }}>{p.d}</div>
                <div style={{
                  width: i === 0 ? 14 : 10, height: i === 0 ? 14 : 10, borderRadius: 7,
                  background: i === 0 ? "var(--saffron-500)" : "var(--paper)",
                  border: i === 0 ? "none" : "1.4px solid var(--hairline)",
                  boxShadow: i === 0 ? "0 0 0 3px var(--saffron-50)" : "none",
                  marginTop: i === 0 ? 0 : 2,
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px", display: "flex", gap: 10 }}>
        <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={() => router.push(`/chapter/${chapter}`)}>
          Back to chapter
        </button>
        <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => router.push("/home")}>
          Done
        </button>
      </div>
    </div>
  );
}
