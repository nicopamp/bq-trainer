"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { useVoiceGrading } from "@/lib/useVoiceGrading";
import type { DrillModeProps } from "../drillTypes";

export function RefToVerseDrillMode({ header, item, vref, onResult, shortcuts }: DrillModeProps) {
  const [revealed, setRevealed] = useState(false);

  const { start, isListening, transcript, gradeResult, voiceUnavailable } = useVoiceGrading(item.text, {
    onError: () => setRevealed(true),
  });

  // Auto-reveal when voice grading completes or voice is unavailable
  useEffect(() => { if (gradeResult !== null) setRevealed(true); }, [gradeResult]);
  useEffect(() => { if (voiceUnavailable) setRevealed(true); }, [voiceUnavailable]);

  // Reveal shortcut available before the answer is shown
  useEffect(() => {
    const sc = shortcuts.current;
    if (revealed) { sc.reveal = null; return; }
    sc.reveal = () => setRevealed(true);
    return () => { sc.reveal = null; };
  }, [revealed, shortcuts]);

  // Grade shortcuts available after reveal
  useEffect(() => {
    const sc = shortcuts.current;
    if (!revealed) { sc.grade = null; return; }
    sc.grade = (g) => onResult(g, transcript || undefined, gradeResult?.accuracy ?? undefined);
    return () => { sc.grade = null; };
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
              {(["Again", "Hard", "Good", "Easy"] as const).map((label, i) => (
                <button key={label} onClick={() => onResult((i + 1) as 1 | 2 | 3 | 4, transcript || undefined, gradeResult.accuracy)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {revealed && gradeResult === null && (
          <div style={{ marginTop: 14, width: "100%", display: "flex", gap: 8 }}>
            {(["Again", "Hard", "Good", "Easy"] as const).map((label, i) => (
              <button key={label} onClick={() => onResult((i + 1) as 1 | 2 | 3 | 4)} className="btn btn-md" style={{ flex: 1, background: i >= 2 ? "var(--leaf-500)" : "var(--bg-deep)", color: i >= 2 ? "#fff" : "var(--ink)", border: "1px solid var(--hairline)" }}>
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
            onClick={start}
          >
            <Icon name="mic-fill" size={20} color="#fff" />
            <span className="t-display" style={{ fontSize: 16 }}>{isListening ? "Listening…" : "Speak the verse"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
