"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useDrillSession } from "./useDrillSession";
import type { DrillItemInput, DrillItem, ModeProgress } from "./useDrillSession";
import type { ShortcutHandlers, ShortcutRef } from "./drillTypes";
import { AudioDrillMode } from "./modes/AudioDrillMode";
import { FinishItDrillMode } from "./modes/FinishItDrillMode";
import { TypeOutDrillMode } from "./modes/TypeOutDrillMode";
import { RefToVerseDrillMode } from "./modes/RefToVerseDrillMode";

export type { DrillItemInput };

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
      <button
        onClick={onEnd}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 14px", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.65)", width: "100%", textAlign: "left" }}
      >
        <Icon name="close" size={18} color="rgba(255,255,255,0.65)" />
        <span style={{ fontSize: 13 }}>End session</span>
      </button>

      <div style={{ padding: "0 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="eyebrow" style={{ color: "var(--saffron-300)", marginBottom: 2, fontSize: 10 }}>Today&apos;s review</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{book} · KJV</div>
      </div>

      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Progress</span>
          <span className="t-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{idx + 1} / {total}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--saffron-500)", borderRadius: 2, transition: "width 200ms" }} />
        </div>
      </div>

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

// ── Drill header (mobile only) ─────────────────────────────────────
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

// ── Session complete ───────────────────────────────────────────────
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

// ── DrillClient (orchestration) ────────────────────────────────────
interface Props { items: DrillItemInput[]; }

export function DrillClient({ items }: Props) {
  const router = useRouter();
  const session = useDrillSession(items);

  const shortcutRef = useRef<ShortcutHandlers>({ grade: null, reveal: null });

  const handleResultRef = useRef(session.handleResult);
  handleResultRef.current = session.handleResult;

  const prevIdx = useRef(-1);
  if (prevIdx.current !== session.idx) {
    shortcutRef.current = { grade: null, reveal: null };
    prevIdx.current = session.idx;
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "r" || e.key === "R") {
        shortcutRef.current.reveal?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleResultRef.current(1);
      } else if (e.key === "1") shortcutRef.current.grade?.(1);
      else if (e.key === "2") shortcutRef.current.grade?.(2);
      else if (e.key === "3") shortcutRef.current.grade?.(3);
      else if (e.key === "4") shortcutRef.current.grade?.(4);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (session.done) {
    return <SessionComplete results={session.results} total={session.total} onBack={() => router.push("/home")} />;
  }

  const { current, idx, total, progress, vref, modeProgress, handleResult } = session;

  const header = (
    <DrillHeader idx={idx} total={total} progress={progress} onBack={() => router.back()} />
  );

  const modeProps = { key: idx, header, item: current, vref, onResult: handleResult, shortcuts: shortcutRef as ShortcutRef };

  let modeContent: React.ReactNode;
  switch (current.mode) {
    case "audio":      modeContent = <AudioDrillMode    {...modeProps} />; break;
    case "finish_it":  modeContent = <FinishItDrillMode {...modeProps} />; break;
    case "type_out":   modeContent = <TypeOutDrillMode  {...{ ...modeProps, onResult: (g: 1|2|3|4) => handleResult(g) }} />; break;
    case "ref_to_verse": modeContent = <RefToVerseDrillMode {...modeProps} />; break;
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
