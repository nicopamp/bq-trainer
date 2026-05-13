"use client";

import { useState, useCallback } from "react";
import { chunkVerse } from "@/lib/chunking";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { submitReview } from "@/lib/actions";
import { speakVerse } from "@/lib/tts";
import { gradeVoice, asrAccuracyToGrade, gradeTypeOut } from "@/lib/grading";
import type { GradeResult } from "@/lib/grading";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import type { DrillMode } from "@/lib/supabase/types";

// Shape the server provides — mode is assigned client-side
export interface DrillItemInput {
  verseId: number;
  book: string;
  chapter: number;
  verseNum: string | number;
  text: string;
  state: string;
}

interface DrillItem extends DrillItemInput {
  mode: Mode;
}

interface Props { items: DrillItemInput[]; }

type Mode = "audio" | "finish_it" | "type_out" | "ref_to_verse";

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

  const [orderedItems] = useState<DrillItem[]>(() => {
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
// Three-phase flow: listen (opening chunk TTS) → speak (complete verse) → ref (identify reference)
function AudioDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
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
    const showManualGrade = voiceUnavailable || gradeResult !== null;

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
function FinishItDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
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
function TypeOutDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4) => void;
}) {
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const gradeResult = submitted ? gradeTypeOut(typed, item.text) : null;

  const handleCheck = () => {
    setSubmitted(true);
    const result = gradeTypeOut(typed, item.text);
    onResult(result.pass ? 3 : 1);
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
function RefToVerseDrill({ header, item, vref, onResult }: {
  header: React.ReactNode; item: DrillItem; vref: string;
  onResult: (grade: 1|2|3|4, transcript?: string, accuracy?: number) => void;
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
