"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { gradeAttempt } from "@/lib/grading";
import type { DrillModeProps } from "../drillTypes";

// TypeOutDrillMode has a distinct onResult signature — no transcript or accuracy
interface TypeOutProps extends Omit<DrillModeProps, "onResult"> {
  onResult: (grade: 1 | 2 | 3 | 4) => void;
}

export function TypeOutDrillMode({ header, item, vref, onResult, shortcuts }: TypeOutProps) {
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const gradeResult = submitted ? gradeAttempt("type_out", typed, item.text) : null;

  const handleCheck = () => {
    setSubmitted(true);
    const result = gradeAttempt("type_out", typed, item.text);
    onResult(result.grade);
  };

  // Register grade shortcuts when grade buttons appear after submission
  useEffect(() => {
    const sc = shortcuts.current;
    if (!gradeResult) { sc.grade = null; return; }
    sc.grade = (g) => onResult(g);
    return () => { sc.grade = null; };
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
              {(["Again", "Hard", "Good", "Easy"] as const).map((label, i) => (
                <button key={label} onClick={() => onResult((i + 1) as 1 | 2 | 3 | 4)} className="btn btn-sm" style={{ flex: 1, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bottom-bar" style={{ padding: "16px 22px 28px" }}>
        {!submitted && (
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={handleCheck} disabled={typed.trim().length < 5}>
            Check <Icon name="check" size={18} color="var(--bg)" />
          </button>
        )}
      </div>
    </div>
  );
}
