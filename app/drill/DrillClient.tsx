"use client";

import { useState, useEffect, useRef } from "react";
import { chunkVerse } from "@/lib/chunking";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { speakVerse } from "@/lib/tts";
import { gradeVoice, asrAccuracyToGrade, gradeTypeOut } from "@/lib/grading";
import type { GradeResult } from "@/lib/grading";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import { useDrillSession } from "./useDrillSession";
import type { DrillItemInput, DrillItem, ModeProgress } from "./useDrillSession";

export type { DrillItemInput };

// Mutable ref holding the active keyboard shortcut handlers.
// Mode components write to this ref as their available actions change.
type ShortcutHandlers = {
  grade: ((g: 1 | 2 | 3 | 4) => void) | null;
  reveal: (() => void) | null;
};
type ShortcutRef = React.MutableRefObject<ShortcutHandlers>;

const MODE_LABELS: Record<string, string> = {
  audio: "Audio",
  finish_it: "Finish it",
  type_out: "Type out",
  ref_to_verse: "Ref → verse",
};

// ── Drill sidebar ──────────────────────────────────────────────────
function DrillSidebar({ modeProgress, idx, total, progress, book, onEnd }: {
  modeProgress: ModeProgress[];
  idx: number;
  total: number;
  progress: number;
  book: string;
  onEnd: () => void;
}) {
  return (
    <aside className="drill-sidebar">
      {/* End session */}
      <button
        onClick={onEnd}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 14px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", width: "100%", textAlign: "left" }}
      >
        <Icon name="close" size={18} color="rgba(255,255,255,0.65)" />
        <span style={{ fontSize: 13 }}>End session</span>
      </button>

      {/* Session title */}
      <div style={{ padding: "0 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 2, fontSize: 10 }}>Today&apos;s review</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{book} · KJV</div>
      </div>

      {/* Overall progress */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Progress</span>
          <span className="t-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{idx + 1} / {total}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--saffron-500)", borderRadius: 2, transition: "width 200ms" }} />
        </div>
      </div>

      {/* Per-mode rows */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {modeProgress.map(({ mode, total: mTotal, completed, status }) => {
          const barColor =
            status === "done" ? "var(--leaf-500)" :
            status === "active" ? "var(--saffron-500)" :
            null;
          const labelColor = status === "active" ? "#fff" : "rgba(255,255,255,0.45)";
          return (
            <div key={mode}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: labelColor, fontWeight: status === "active" ? 600 : 400 }}>
                  {MODE_LABELS[mode] ?? mode}
                </span>
                <span className="t-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  {completed} / {mTotal}
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                {barColor && (
                  <div style={{ width: `${(completed / mTotal) * 100}%`, height: "100%", background: barColor, borderRadius: 2, transition: "width 200ms" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyboard shortcuts panel */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="eyebrow" style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10, fontSize: 9 }}>Keyboard shortcuts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            ["Reveal", "R"],
            ["Skip", "↓"],
            ["Again", "1"],
            ["Hard", "2"],
            ["Good", "3"],
            ["Easy", "4"],
          ].map(([label, key]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
              <kbd style={{ fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.08)", borderRadius: 4, color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono)" }}>{key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Drill header (mobile only — hidden at ≥768px via .drill-header) ─
function DrillHeader({ idx, total, progress, onBack }: {
  idx: number; total: number; progress: number; onBack: () => void;
}) {
  return (
    <div className="drill-header" style={{ padding: "4px 22px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", lineHeight: 0, color: "var(--ink-soft)" }}>
          <Icon name="close" size={22} color="var(--ink-soft)" />
        </button>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--bg-deep)", overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--saffron-500)", borderRadius: 2, transition: "width 200ms" }} />
        </div>
        <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-muted)" }}>{idx + 1} / {total}</div>
      </div>
    </div>
  );
}

interface Props { items: DrillItemInput[]; }

export function DrillClient({ items }: Props) {
  const router = useRouter();
  const session = useDrillSession(items);

  const shortcutRef = useRef<ShortcutHandlers>({ grade: null, reveal: null });

  // Keep a stable ref to handleResult so the keydown handler never goes stale
  const handleResultRef = useRef(session.handleResult);
  handleResultRef.current = session.handleResult;

  // Reset shortcuts whenever the active item changes
  const prevIdx = useRef(-1);
  if (prevIdx.current !== session.idx) {
    shortcutRef.current = { grade: null, reveal: null };
    prevIdx.current = session.idx;
  }

  // Global keyboard shortcut listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "r" || e.key === "R") {
        shortcutRef.current.reveal?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleResultRef.current(1); // skip = grade Again
      } else if (e.key === "1") shortcutRef.current.grade?.(1);
      else if (e.key === "2") shortcutRef.current.grade?.(2);
      else if (e.key === "3") shortcutRef.current.grade?.(3);
      else if (e.key === "4") shortcutRef.current.grade?.(4);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // reads from refs — no deps needed

  if (session.done) {
    return <SessionComplete results={session.results} total={session.total} onBack={() => router.push("/home")} />;
  }

  const { current, idx, total, progress, vref, modeProgress, handleResult } = session;

  const header = (
    <DrillHeader idx={idx} total={total} progress={progress} onBack={() => router.back()} />
  );

  let modeContent: React.ReactNode;
  switch (current.mode) {
    case "audio":
      modeContent = <AudioDrill key={idx} header={header} item={current} vref={vref} onResult={handleResult} shortcuts={shortcutRef} />;
      break;
    case "finish_it":
      modeContent = <FinishItDrill key={idx} header={header} item={current} vref={vref} onResult={handleResult} shortcuts={shortcutRef} />;
      break;
    case "type_out":
      modeContent = <TypeOutDrill key={idx} header={header} item={current} vref={vref} onResult={handleResult} shortcuts={shortcutRef} />;
      break;
    case "ref_to_verse":
      modeContent = <RefToVerseDrill key={idx} header={header} item={current} vref={vref} onResult={handleResult} shortcuts={shortcutRef} />;
      break;
  }

  return (
    <div className="drill-wrapper">
      <DrillSidebar
        modeProgress={modeProgress}
        idx={idx}
        total={total}
        progress={progress}
        book={current.book}
        onEnd={() => router.back()}
      />
      <div className="drill-main">
        {modeContent}
      </div>
    </div>
  );
}

// ── Audio Drill ────────────────────────────────────────────────────
// Three-phase flow: listen (opening chunk TTS) → speak (complete verse) → ref (identify reference)
function AudioDrill({ header, item, vref, onResult, shortcuts }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
  shortcuts: ShortcutRef;
}) {
  const [phase, setPhase] = useState<"listen" | "speak" | "ref">("listen");
  const [voiceGrade, setVoiceGrade] = useState<1|2|3|4>(1);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const [refSelected, setRefSelected] = useState<string | null>(null);
  const [refInput, setRefInput] = useState("");
  const [refRevealed, setRefRevealed] = useState(false);

  const openingChunk = chunkVerse(item.text)[0];
  const remainder = item.text.slice(openingChunk.length).trim();
  const fullVref = `${item.book} ${vref}`;

  const [choices] = useState<string[]>(() => {
    const ch = item.chapter;
    const v = Number(item.verseNum);
    const distractors = [
      `${item.book} ${ch}:${v === 1 ? 2 : v - 1}`,
      `${item.book} ${ch === 1 ? 2 : ch - 1}:${v}`,
      `${item.book} ${ch + 1 > 9 ? ch - 1 : ch + 1}:${Math.max(1, v - 2)}`,
    ];
    return [fullVref, ...distractors].sort(() => Math.random() - 0.5);
  });

  const { startListening, transcript, isListening, isSupported } = useSpeechRecognition({
    onFinal: (said) => {
      const result = gradeVoice(said, remainder || item.text);
      setGradeResult(result);
      setVoiceGrade(asrAccuracyToGrade(result.accuracy));
    },
  });

  const showManualGrade = voiceUnavailable || gradeResult !== null;

  // Register grade shortcuts in speak phase when grade buttons are visible
  useEffect(() => {
    if (phase !== "speak" || !showManualGrade) { shortcuts.current.grade = null; return; }
    shortcuts.current.grade = (g) => {
      setVoiceGrade(g);
      setPhase("ref");
    };
    return () => { shortcuts.current.grade = null; };
  }, [phase, showManualGrade, shortcuts]);

  const handleListen = () => {
    if (!isSupported) { setVoiceUnavailable(true); return; }
    startListening();
  };

  const handleManualGrade = (g: 1|2|3|4) => {
    setVoiceGrade(g);
    setPhase("ref");
  };

  // ── Listen phase ──
  if (phase === "listen") {
    return (
      <div className="bqt-screen" style={{ background: "var(--ink)", color: "#fff" }}>
        {header}
        <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
          <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 4 }}>Audio drill</div>
          <div className="t-display" style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: "#fff" }}>Listen to the opening words</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4 }}>Hear the start of the verse · then complete it aloud</div>
        </div>
        <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r-xl)", padding: 24, marginBottom: 18 }}>
            <button
              style={{ width: 64, height: 64, borderRadius: 32, background: "var(--saffron-500)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(201,132,44,.4)" }}
              onClick={() => speakVerse(item.chapter, Number(item.verseNum), openingChunk)}
            >
              <Icon name="play" size={26} color="#fff" />
            </button>
            <div style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,.55)" }}>Tap to hear the opening words</div>
            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.06)", color: "#fff", border: "1px solid rgba(255,255,255,.12)", marginTop: 12 }} onClick={() => speakVerse(item.chapter, Number(item.verseNum), openingChunk)}>
              <Icon name="rewind" size={14} color="#fff" />
              Replay
            </button>
          </div>
        </div>
        <div className="bottom-bar bottom-bar-dark" style={{ padding: "16px 22px 28px" }}>
          <button className="btn btn-saffron btn-lg" style={{ width: "100%" }} onClick={() => setPhase("speak")}>
            Ready to speak <Icon name="chevron-right" size={18} color="#fff" />
          </button>
        </div>
      </div>
    );
  }

  // ── Speak phase ──
  if (phase === "speak") {
    return (
      <div className="bqt-screen" style={{ background: "var(--ink)", color: "#fff" }}>
        {header}
        <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
          <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 4 }}>Audio drill</div>
          <div className="t-display" style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: "#fff" }}>Complete the verse</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4 }}>Speak the rest aloud after the opening words</div>
        </div>
        <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: "var(--r-xl)", padding: 20, marginBottom: 14 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,.4)", marginBottom: 6, fontSize: 10 }}>opening words</div>
            <div className="t-display-italic" style={{ fontSize: 18, color: "rgba(255,255,255,.8)", lineHeight: 1.4 }}>&ldquo;{openingChunk}&rdquo;</div>
            <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.06)", color: "#fff", border: "1px solid rgba(255,255,255,.12)", marginTop: 12 }} onClick={() => speakVerse(item.chapter, Number(item.verseNum), openingChunk)}>
              <Icon name="rewind" size={14} color="#fff" />
              Replay
            </button>
          </div>

          {transcript && (
            <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: "var(--r-md)", background: "rgba(255,255,255,.05)" }}>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,.4)", marginBottom: 4, fontSize: 10 }}>you said</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)", fontStyle: "italic" }}>{transcript}</div>
            </div>
          )}

          {showManualGrade && (
            <div style={{ padding: "14px 18px", borderRadius: "var(--r-md)", background: gradeResult?.pass ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {gradeResult !== null
                  ? `${gradeResult.pass ? "Well done!" : "Not quite"} · ${Math.round(gradeResult.accuracy * 100)}% accuracy`
                  : "Grade manually"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {([1,2,3,4] as const).map((g) => (
                  <button key={g} onClick={() => handleManualGrade(g)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                    {["Again", "Hard", "Good", "Easy"][g-1]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bottom-bar bottom-bar-dark" style={{ padding: "16px 22px 28px", display: "flex", gap: 10 }}>
          {gradeResult !== null || voiceUnavailable ? (
            <button className="btn btn-saffron btn-lg" style={{ flex: 1 }} onClick={() => setPhase("ref")}>
              Identify the reference <Icon name="chevron-right" size={18} color="#fff" />
            </button>
          ) : (
            <button
              style={{ flex: 1, height: 56, borderRadius: 32, border: "none", cursor: "pointer", background: isListening ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              onClick={handleListen}
            >
              <Icon name="mic-fill" size={20} color="#fff" />
              <span className="t-display" style={{ fontSize: 16 }}>{isListening ? "Listening…" : "Tap & speak"}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Ref phase ──
  const isLearning = item.state === "learning";
  const refCorrect = isLearning
    ? refSelected === fullVref
    : refInput.trim().toLowerCase() === fullVref.toLowerCase();
  const refAnswered = isLearning ? refSelected !== null : refRevealed;

  return (
    <div className="bqt-screen" style={{ background: "var(--ink)", color: "#fff" }}>
      {header}
      <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 4 }}>Audio drill</div>
        <div className="t-display" style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 500, color: "#fff" }}>Identify the reference</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 4 }}>
          {isLearning ? "Pick the reference" : "Type the reference"}
        </div>
      </div>
      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
        {isLearning ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {choices.map((choice, i) => {
              const isCorrect = choice === fullVref;
              const isSelected = choice === refSelected;
              let bg = "rgba(255,255,255,.05)";
              let border = "1px solid rgba(255,255,255,.12)";
              if (refSelected) {
                if (isCorrect) { bg = "var(--leaf-500)"; border = "1px solid var(--leaf-500)"; }
                else if (isSelected) { bg = "var(--rust-500)"; border = "1px solid var(--rust-500)"; }
              }
              return (
                <button key={choice} onClick={() => !refSelected && setRefSelected(choice)} style={{ background: bg, border, borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, cursor: refSelected ? "default" : "pointer", color: "#fff", textAlign: "left", fontFamily: "var(--font-body)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, border: refSelected && isCorrect ? "none" : "1.4px solid rgba(255,255,255,.4)", background: refSelected && isCorrect ? "rgba(255,255,255,.18)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>
                    {refSelected && isCorrect ? <Icon name="check" size={12} color="#fff" strokeWidth={2.4} /> : String.fromCharCode(65 + i)}
                  </div>
                  <span className="t-display" style={{ fontSize: 20, fontWeight: 500 }}>{choice}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={refInput}
              onChange={(e) => !refRevealed && setRefInput(e.target.value)}
              disabled={refRevealed}
              placeholder={`e.g. ${item.book} 1:1`}
              style={{ width: "100%", padding: "16px 18px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: "var(--r-lg)", fontSize: 20, fontFamily: "var(--font-display)", color: "#fff", outline: "none" }}
            />
            {!refRevealed && (
              <button className="btn btn-saffron btn-lg" style={{ width: "100%", marginTop: 12 }} onClick={() => setRefRevealed(true)} disabled={refInput.trim().length < 3}>
                Check
              </button>
            )}
            {refRevealed && (
              <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: "var(--r-md)", background: refCorrect ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
                <div style={{ fontWeight: 600 }}>{refCorrect ? "Correct!" : `Answer: ${fullVref}`}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {refAnswered && (
        <div className="bottom-bar bottom-bar-dark" style={{ padding: "14px 22px 28px" }}>
          <button className="btn btn-saffron btn-lg" style={{ width: "100%" }} onClick={() => onResult(voiceGrade, transcript || undefined, gradeResult?.accuracy ?? undefined)}>
            Next <Icon name="chevron-right" size={18} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Finish-it Drill ────────────────────────────────────────────────
function FinishItDrill({ header, item, vref, onResult, shortcuts }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
  shortcuts: ShortcutRef;
}) {
  const words = item.text.split(" ");
  const showCount = Math.min(3, Math.floor(words.length * 0.25));
  const prompt = words.slice(0, showCount).join(" ");
  const rest = words.slice(showCount).join(" ");

  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);

  const { startListening, transcript, isListening, isSupported } = useSpeechRecognition({
    onFinal: (said) => setGradeResult(gradeVoice(said, rest)),
  });

  const handleListen = () => {
    if (!isSupported) { setVoiceUnavailable(true); return; }
    startListening();
  };

  const displayTranscript = transcript || (voiceUnavailable ? "(voice not available — tap grade)" : "");
  const autoGrade = gradeResult !== null ? asrAccuracyToGrade(gradeResult.accuracy) : null;
  const showManualGrade = voiceUnavailable || gradeResult !== null;

  // Register grade shortcuts when grade buttons are visible
  useEffect(() => {
    if (!showManualGrade) { shortcuts.current.grade = null; return; }
    shortcuts.current.grade = (g) => onResult(g, transcript || undefined, gradeResult?.accuracy ?? undefined);
    return () => { shortcuts.current.grade = null; };
  }, [showManualGrade, shortcuts, onResult, transcript, gradeResult]);

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
            <span style={{ color: "var(--ink-muted)", fontStyle: "italic" }}> {displayTranscript || "…"}</span>
          </div>
          {displayTranscript && !voiceUnavailable && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--bg-deep)", borderRadius: "var(--r-md)" }}>
              <div className="eyebrow" style={{ marginBottom: 4 }}>target ending</div>
              <div className="t-display-italic" style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.4 }}>{rest}</div>
            </div>
          )}
        </div>

        {showManualGrade && (
          <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: "var(--r-md)", background: gradeResult?.pass ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {gradeResult !== null
                ? `${gradeResult.pass ? "Well done!" : "Not quite"} · ${Math.round(gradeResult.accuracy * 100)}% accuracy`
                : "Grade manually"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {([1,2,3,4] as const).map((g) => (
                <button key={g} onClick={() => onResult(g, transcript || undefined, gradeResult?.accuracy ?? undefined)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {["Again", "Hard", "Good", "Easy"][g-1]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px", display: "flex", gap: 10 }}>
        {!displayTranscript ? (
          <button
            style={{ flex: 1, height: 64, borderRadius: 32, border: "none", cursor: "pointer", background: isListening ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            onClick={handleListen}
          >
            <Icon name="mic-fill" size={20} color="#fff" />
            <span className="t-display" style={{ fontSize: 16 }}>{isListening ? "Listening…" : "Tap & speak"}</span>
          </button>
        ) : autoGrade !== null && (
          <button className="btn btn-saffron btn-lg" style={{ flex: 1 }} onClick={() => onResult(autoGrade, transcript || undefined, gradeResult?.accuracy ?? undefined)}>
            Next <Icon name="chevron-right" size={18} color="#fff" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Type-out Drill ─────────────────────────────────────────────────
function TypeOutDrill({ header, item, vref, onResult, shortcuts }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4) => void;
  shortcuts: ShortcutRef;
}) {
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const gradeResult = submitted ? gradeTypeOut(typed, item.text) : null;

  const handleCheck = () => {
    setSubmitted(true);
    const result = gradeTypeOut(typed, item.text);
    onResult(result.pass ? 3 : 1);
  };

  // Register grade shortcuts when grade buttons appear after submission
  useEffect(() => {
    if (!gradeResult) { shortcuts.current.grade = null; return; }
    shortcuts.current.grade = (g) => onResult(g);
    return () => { shortcuts.current.grade = null; };
  }, [gradeResult, shortcuts, onResult]);

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
        {gradeResult && (
          <div className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>original</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {gradeResult.wordResults.map(({ word, correct }, i) => (
                <span key={i} className="t-display" style={{ fontSize: 16, color: correct ? "var(--leaf-500)" : "var(--rust-500)", lineHeight: 1.5 }}>{word}</span>
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

        {gradeResult && (
          <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: "var(--r-md)", background: gradeResult.pass ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{Math.round(gradeResult.accuracy * 100)}% accuracy</div>
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
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={handleCheck} disabled={typed.trim().length < 5}>
            Check <Icon name="check" size={18} color="var(--bg)" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Ref-to-Verse Drill ─────────────────────────────────────────────
function RefToVerseDrill({ header, item, vref, onResult, shortcuts }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
  shortcuts: ShortcutRef;
}) {
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [revealed, setRevealed] = useState(false);

  const { startListening, transcript, isListening, isSupported } = useSpeechRecognition({
    onFinal: (said) => {
      setGradeResult(gradeVoice(said, item.text));
      setRevealed(true);
    },
    onError: () => setRevealed(true),
  });

  const handleListen = () => {
    if (!isSupported) { setRevealed(true); return; }
    startListening();
  };

  // Reveal shortcut available before the answer is shown
  useEffect(() => {
    if (revealed) { shortcuts.current.reveal = null; return; }
    shortcuts.current.reveal = () => setRevealed(true);
    return () => { shortcuts.current.reveal = null; };
  }, [revealed, shortcuts]);

  // Grade shortcuts available after reveal
  useEffect(() => {
    if (!revealed) { shortcuts.current.grade = null; return; }
    shortcuts.current.grade = (g) => onResult(g, transcript || undefined, gradeResult?.accuracy ?? undefined);
    return () => { shortcuts.current.grade = null; };
  }, [revealed, shortcuts, onResult, transcript, gradeResult]);

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />
      {header}

      <div style={{ padding: "0 22px 14px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ color: "var(--saffron-700)" }}>Ref → verse</div>
        <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>Recite this verse</div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{item.book}</div>
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

        {gradeResult !== null && (
          <div style={{ marginTop: 14, width: "100%", padding: "14px 18px", borderRadius: "var(--r-md)", background: gradeResult.pass ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff" }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{Math.round(gradeResult.accuracy * 100)}% accuracy</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(["Again","Hard","Good","Easy"] as const).map((label, i) => (
                <button key={label} onClick={() => onResult((i + 1) as 1|2|3|4, transcript || undefined, gradeResult.accuracy)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {revealed && gradeResult === null && (
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
            style={{ flex: 1, height: 56, borderRadius: 32, border: "none", cursor: "pointer", background: isListening ? "var(--leaf-500)" : "var(--rust-500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            onClick={handleListen}
          >
            <Icon name="mic-fill" size={20} color="#fff" />
            <span className="t-display" style={{ fontSize: 16 }}>{isListening ? "Listening…" : "Speak the verse"}</span>
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
