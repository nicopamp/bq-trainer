"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { submitReview } from "@/lib/actions";
import { speakVerse, stopSpeaking } from "@/lib/tts";
import type { DrillMode } from "@/lib/supabase/types";

interface DrillItem {
  verseId: number;
  chapter: number;
  verseNum: string | number;
  text: string;
  mode: "audio" | "finish_it" | "type_out" | "ref_to_verse";
  state: string;
}

interface Props { items: DrillItem[]; }

type Mode = DrillItem["mode"];

function getModeRotation(order: string): Mode[] {
  if (order === "audio")    return ["audio", "ref_to_verse", "finish_it", "type_out"];
  if (order === "type_out") return ["type_out", "finish_it", "ref_to_verse", "audio"];
  return ["audio", "finish_it", "type_out", "ref_to_verse"];
}

export function DrillClient({ items }: Props) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<{ grade: number; mode: string }[]>([]);
  const router = useRouter();

  const [orderedItems] = useState(() => {
    const order = localStorage.getItem("bqt_drill_order") ?? "mixed";
    const rotation = getModeRotation(order);
    return items.map((item, i) => ({ ...item, mode: rotation[i % rotation.length] }));
  });

  const current = orderedItems[idx];

  const handleResult = useCallback(async (grade: 1 | 2 | 3 | 4, transcript?: string, accuracy?: number) => {
    const start = Date.now();
    setResults((r) => [...r, { grade, mode: current.mode }]);

    await submitReview({
      verseId: current.verseId,
      drillMode: current.mode as DrillMode,
      grade,
      durationMs: Date.now() - start,
      transcript,
      accuracy,
    });

    if (idx + 1 >= orderedItems.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }, [current, idx, orderedItems.length]);

  if (done) {
    return <SessionComplete results={results} total={orderedItems.length} onBack={() => router.push("/home")} />;
  }

  const vref = `${current.chapter}:${current.verseNum}`;
  const progress = idx / orderedItems.length;

  const DrillHeader = () => (
    <div style={{ padding: "4px 22px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", lineHeight: 0, color: "var(--ink-soft)" }}>
          <Icon name="close" size={22} color="var(--ink-soft)" />
        </button>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--bg-deep)", overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--saffron-500)", borderRadius: 2, transition: "width 200ms" }} />
        </div>
        <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-muted)" }}>{idx + 1} / {orderedItems.length}</div>
      </div>
    </div>
  );

  switch (current.mode) {
    case "audio":
      return <AudioDrill header={<DrillHeader />} item={current} vref={vref} onResult={handleResult} />;
    case "finish_it":
      return <FinishItDrill header={<DrillHeader />} item={current} vref={vref} onResult={handleResult} />;
    case "type_out":
      return <TypeOutDrill header={<DrillHeader />} item={current} vref={vref} onResult={handleResult} />;
    case "ref_to_verse":
      return <RefToVerseDrill header={<DrillHeader />} item={current} vref={vref} onResult={handleResult} />;
  }
}

// ── Audio Drill ────────────────────────────────────────────────────
function AudioDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4) => void;
}) {
  const [played, setPlayed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Build 4 reference choices including the correct one
  const ch = item.chapter;
  const v = Number(item.verseNum);
  const distractors = [
    `Acts ${ch}:${v === 1 ? 2 : v - 1}`,
    `Acts ${ch === 1 ? 2 : ch - 1}:${v}`,
    `Acts ${ch + 1 > 9 ? ch - 1 : ch + 1}:${Math.max(1, v - 2)}`,
  ];
  const choices = [vref, ...distractors].sort(() => Math.random() - 0.5);

  const speak = () => { speakVerse(item.chapter, Number(item.verseNum), item.text); setPlayed(true); };

  const handleSelect = (choice: string) => {
    if (selected) return;
    setSelected(choice);
    setRevealed(true);
  };

  return (
    <div className="bqt-screen" style={{ background: "var(--ink)", color: "#fff" }}>
      {header}

      <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 4 }}>Audio drill</div>
        <div className="t-display" style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: "#fff" }}>Which verse is this?</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4 }}>Listen · then pick the reference</div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* player */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r-xl)", padding: 24, marginBottom: 18 }}>
          <button
            style={{ width: 64, height: 64, borderRadius: 32, background: "var(--saffron-500)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(201,132,44,.4)" }}
            onClick={speak}
          >
            <Icon name="play" size={26} color="#fff" />
          </button>
          <div style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,.55)" }}>
            {played ? "Played · listen again →" : "Tap to hear the verse"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.06)", color: "#fff", border: "1px solid rgba(255,255,255,.12)" }} onClick={speak}>
              <Icon name="rewind" size={14} color="#fff" />
              Replay
            </button>
            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.06)", color: "#fff", border: "1px solid rgba(255,255,255,.12)" }} onClick={() => setRevealed(true)}>
              <Icon name="eye" size={14} color="#fff" />
              Reveal
            </button>
          </div>
        </div>

        {revealed && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--r-md)", background: "rgba(255,255,255,.05)", marginBottom: 14 }}>
            <div className="t-display-italic" style={{ fontSize: 14, color: "rgba(255,255,255,.7)", lineHeight: 1.4 }}>&ldquo;{item.text}&rdquo;</div>
          </div>
        )}

        {/* choices */}
        <div className="eyebrow" style={{ color: "rgba(255,255,255,.5)", marginBottom: 10 }}>your answer</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {choices.map((choice, i) => {
            const isCorrect = choice === vref;
            const isSelected = choice === selected;
            let bg = "rgba(255,255,255,.05)";
            let border = "1px solid rgba(255,255,255,.12)";
            if (selected) {
              if (isCorrect) { bg = "var(--leaf-500)"; border = "1px solid var(--leaf-500)"; }
              else if (isSelected) { bg = "var(--rust-500)"; border = "1px solid var(--rust-500)"; }
            }
            return (
              <button key={choice} onClick={() => handleSelect(choice)} style={{ background: bg, border, borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: selected ? "default" : "pointer", color: "#fff", textAlign: "left", fontFamily: "var(--font-body)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, border: selected && isCorrect ? "none" : "1.4px solid rgba(255,255,255,.4)", background: selected && isCorrect ? "rgba(255,255,255,.18)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>
                    {selected && isCorrect ? <Icon name="check" size={12} color="#fff" strokeWidth={2.4} /> : String.fromCharCode(65 + i)}
                  </div>
                  <span className="t-display" style={{ fontSize: 20, fontWeight: 500 }}>{choice}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="bottom-bar bottom-bar-dark" style={{ padding: "14px 22px 28px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected === vref ? "var(--leaf-500)" : "var(--rust-500)" }}>
              {selected === vref ? "Correct!" : "Incorrect"}
            </div>
          </div>
          <button className="btn btn-saffron btn-md" onClick={() => onResult(selected === vref ? 3 : 1)}>
            Next <Icon name="chevron-right" size={16} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Finish-it Drill ────────────────────────────────────────────────
function FinishItDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
}) {
  const words = item.text.split(" ");
  const showCount = Math.min(3, Math.floor(words.length * 0.25));
  const prompt = words.slice(0, showCount).join(" ");
  const rest = words.slice(showCount).join(" ");

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setTranscript("(voice not available — tap grade)");
      setAccuracy(null);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const said = e.results[0][0].transcript;
      setTranscript(said);
      const targetWords = rest.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
      const saidWords = said.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
      const matches = saidWords.filter((w: string) => targetWords.includes(w)).length;
      setAccuracy(matches / targetWords.length);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const autoGrade = accuracy !== null ? (accuracy >= 0.9 ? 4 : accuracy >= 0.75 ? 3 : accuracy >= 0.5 ? 2 : 1) : null;

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      {header}

      <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--saffron-700)" }}>Finish it</div>
        <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>Speak the rest aloud</div>
      </div>

      <div style={{ padding: "0 22px", marginBottom: 14, position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--ink)", color: "#fff", borderRadius: 999 }}>
          <div className="t-mono" style={{ fontSize: 10, color: "var(--saffron-300)", letterSpacing: "0.1em" }}>ACTS</div>
          <div className="t-display" style={{ fontSize: 14, fontStyle: "italic" }}>{vref}</div>
        </div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1 }}>
        <div className="card" style={{ padding: "24px 20px", minHeight: 200 }}>
          <div className="t-display" style={{ fontSize: 22, lineHeight: 1.5 }}>
            <span style={{ color: "var(--ink)" }}>{prompt}</span>
            <span style={{ color: "var(--ink-muted)", fontStyle: "italic" }}> {transcript ?? "…"}</span>
          </div>
          {transcript && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--bg-deep)", borderRadius: "var(--r-md)" }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>target ending</div>
              <div className="t-display-italic" style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.4 }}>{rest}</div>
            </div>
          )}
        </div>

        {accuracy !== null && (
          <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: "var(--r-md)", background: accuracy >= 0.75 ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {accuracy >= 0.75 ? "Well done!" : "Not quite"} · {Math.round(accuracy * 100)}% accuracy
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {([1,2,3,4] as const).map((g) => (
                <button key={g} onClick={() => onResult(g, transcript ?? undefined, accuracy)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {["Again", "Hard", "Good", "Easy"][g-1]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px", display: "flex", gap: 10 }}>
        {!transcript ? (
          <button
            style={{ flex: 1, height: 64, borderRadius: 32, border: "none", cursor: "pointer", background: listening ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            onClick={startListening}
          >
            <Icon name="mic-fill" size={20} color="#fff" />
            <span className="t-display" style={{ fontSize: 16 }}>{listening ? "Listening…" : "Tap & speak"}</span>
          </button>
        ) : autoGrade !== null && (
          <button className="btn btn-saffron btn-lg" style={{ flex: 1 }} onClick={() => onResult(autoGrade as 1|2|3|4, transcript ?? undefined, accuracy ?? undefined)}>
            Next <Icon name="chevron-right" size={18} color="#fff" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Type-out Drill ─────────────────────────────────────────────────
function TypeOutDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4) => void;
}) {
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const targetWords = item.text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);

  const accuracy = submitted
    ? (() => {
        const typedWords = typed.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
        const matches = typedWords.filter((w) => targetWords.includes(w)).length;
        return matches / targetWords.length;
      })()
    : null;

  const colorWord = (w: string, i: number) => {
    if (!submitted) return "var(--ink-muted)";
    const typedWords = typed.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    return typedWords[i]?.replace(/[^\w]/g, "") === w ? "var(--leaf-500)" : "var(--rust-500)";
  };

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      {header}

      <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--saffron-700)" }}>Type out</div>
        <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>Type the full verse</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--ink)", color: "#fff", borderRadius: 999, marginTop: 8 }}>
          <div className="t-mono" style={{ fontSize: 10, color: "var(--saffron-300)" }}>ACTS</div>
          <div className="t-display" style={{ fontSize: 14, fontStyle: "italic" }}>{vref}</div>
        </div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1 }}>
        {submitted && (
          <div className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>original</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {targetWords.map((w, i) => (
                <span key={i} className="t-display" style={{ fontSize: 16, color: colorWord(w, i), lineHeight: 1.5 }}>{w}</span>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={submitted}
          placeholder="Type the verse from memory…"
          rows={6}
          style={{
            width: "100%", padding: "16px 18px",
            background: "var(--paper)", border: "1px solid var(--hairline)",
            borderRadius: "var(--r-lg)", fontSize: 18,
            fontFamily: "var(--font-display)", lineHeight: 1.5,
            color: "var(--ink)", resize: "none", outline: "none",
          }}
        />

        {accuracy !== null && (
          <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: "var(--r-md)", background: accuracy >= 0.85 ? "var(--leaf-500)" : accuracy >= 0.6 ? "var(--saffron-500)" : "var(--rust-500)", color: "#fff" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{Math.round(accuracy * 100)}% accuracy</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Again","Hard","Good","Easy"] as const).map((label, i) => (
                <button key={label} onClick={() => onResult((i + 1) as 1|2|3|4)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px" }}>
        {!submitted ? (
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setSubmitted(true)} disabled={typed.trim().length < 5}>
            Check <Icon name="check" size={18} color="var(--bg)" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Ref-to-Verse Drill ─────────────────────────────────────────────
function RefToVerseDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setRevealed(true);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const said = e.results[0][0].transcript;
      setTranscript(said);
      const targetWords = item.text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
      const saidWords = said.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
      const matches = saidWords.filter((w: string) => targetWords.includes(w)).length;
      setAccuracy(matches / targetWords.length);
      setRevealed(true);
      setListening(false);
    };
    rec.onerror = () => { setListening(false); setRevealed(true); };
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      {header}

      <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--saffron-700)" }}>Ref → verse</div>
        <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>Recite this verse</div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {/* big reference */}
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Acts</div>
          <div className="t-display" style={{ fontSize: 72, lineHeight: 1, color: "var(--ink)" }}>{vref}</div>
          <div className="t-mono" style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: 8 }}>KJV</div>
        </div>

        {revealed && (
          <div className="card" style={{ padding: "16px 18px", width: "100%" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>the verse</div>
            <div className="t-display" style={{ fontSize: 17, lineHeight: 1.45, color: "var(--ink)", fontWeight: 400 }}>{item.text}</div>
            {transcript && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--bg-deep)", borderRadius: "var(--r-sm)" }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>you said</div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", fontStyle: "italic" }}>{transcript}</div>
              </div>
            )}
          </div>
        )}

        {accuracy !== null && (
          <div style={{ marginTop: 14, width: "100%", padding: "14px 18px", borderRadius: "var(--r-md)", background: accuracy >= 0.8 ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{Math.round(accuracy * 100)}% accuracy</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Again","Hard","Good","Easy"] as const).map((label, i) => (
                <button key={label} onClick={() => onResult((i + 1) as 1|2|3|4, transcript ?? undefined, accuracy ?? undefined)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {revealed && accuracy === null && (
          <div style={{ marginTop: 14, width: "100%", display: "flex", gap: 8 }}>
            {(["Again","Hard","Good","Easy"] as const).map((label, i) => (
              <button key={label} onClick={() => onResult((i + 1) as 1|2|3|4)} className="btn btn-md" style={{ flex: 1, background: i >= 2 ? "var(--leaf-500)" : "var(--bg-deep)", color: i >= 2 ? "#fff" : "var(--ink)", border: "1px solid var(--hairline)" }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!revealed && (
        <div className="bottom-bar" style={{ padding: "16px 22px 28px", display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-lg" style={{ width: 56, padding: 0 }} onClick={() => setRevealed(true)}>
            <Icon name="eye" size={18} color="var(--ink)" />
          </button>
          <button
            style={{ flex: 1, height: 56, borderRadius: 32, border: "none", cursor: "pointer", background: listening ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            onClick={startListening}
          >
            <Icon name="mic-fill" size={20} color="#fff" />
            <span className="t-display" style={{ fontSize: 16 }}>{listening ? "Listening…" : "Speak the verse"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Session Complete ───────────────────────────────────────────────
function SessionComplete({ results, total, onBack }: {
  results: { grade: number; mode: string }[]; total: number; onBack: () => void;
}) {
  const goodCount = results.filter((r) => r.grade >= 3).length;
  const accuracy = Math.round((goodCount / total) * 100);

  return (
    <div className="bqt-screen" style={{ justifyContent: "center" }}>
      <div className="paper-grain" />
      <div style={{ padding: "40px 28px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: "radial-gradient(circle at 50% 35%, var(--saffron-300), var(--saffron-500))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(201,132,44,.35)" }}>
          <Icon name="trophy" size={40} color="#fff" />
        </div>

        <div style={{ textAlign: "center" }}>
          <div className="eyebrow" style={{ color: "var(--saffron-700)", marginBottom: 8 }}>session complete</div>
          <div className="t-display" style={{ fontSize: 32, lineHeight: 1.1 }}>Well done!</div>
          <div style={{ fontSize: 14, color: "var(--ink-muted)", marginTop: 8 }}>
            {total} verse{total !== 1 ? "s" : ""} reviewed
          </div>
        </div>

        <div className="card" style={{ padding: 20, width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {[
              [total, "reviewed"],
              [goodCount, "correct"],
              [accuracy + "%", "accuracy"],
            ].map(([v, l], i) => (
              <div key={String(l)} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid var(--hairline)" : "none" }}>
                <div className="t-display" style={{ fontSize: 28, lineHeight: 1, color: i === 2 && Number(accuracy) >= 80 ? "var(--leaf-500)" : "var(--ink)" }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={onBack}>
          Back home <Icon name="chevron-right" size={18} color="var(--bg)" />
        </button>
      </div>
    </div>
  );
}
