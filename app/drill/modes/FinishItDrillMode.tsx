"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useVoiceGrading } from "@/lib/useVoiceGrading";
import type { DrillModeProps } from "../drillTypes";

export function FinishItDrillMode({ header, item, vref, onResult, shortcuts }: DrillModeProps) {
  const words = item.text.split(" ");
  const showCount = Math.min(3, Math.floor(words.length * 0.25));
  const prompt = words.slice(0, showCount).join(" ");
  const rest = words.slice(showCount).join(" ");

  const { start, isListening, transcript, gradeResult, autoGrade, voiceUnavailable, showManualGrade } =
    useVoiceGrading(rest);

  const displayTranscript = transcript || (voiceUnavailable ? "(voice not available — tap grade)" : "");

  // Register grade shortcuts when grade buttons are visible
  useEffect(() => {
    const sc = shortcuts.current;
    if (!showManualGrade) { sc.grade = null; return; }
    sc.grade = (g) => onResult(g, transcript || undefined, gradeResult?.accuracy ?? undefined);
    return () => { sc.grade = null; };
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
              {([1, 2, 3, 4] as const).map((g) => (
                <button key={g} onClick={() => onResult(g, transcript || undefined, gradeResult?.accuracy ?? undefined)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {["Again", "Hard", "Good", "Easy"][g - 1]}
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
            onClick={start}
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
