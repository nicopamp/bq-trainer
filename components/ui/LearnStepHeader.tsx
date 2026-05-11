"use client";

import Link from "next/link";
import { Icon } from "./Icon";

const STAGES = ["read", "chunk", "trace", "recall", "done"] as const;

interface LearnStepHeaderProps {
  step: 0 | 1 | 2 | 3 | 4;
  title: string;
  vref: string;
  backHref: string;
}

export function LearnStepHeader({ step, title, vref, backHref }: LearnStepHeaderProps) {
  return (
    <div style={{ padding: "4px 22px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <Link href={backHref} style={{ color: "var(--ink-soft)", lineHeight: 0 }}>
          <Icon name="close" size={22} color="var(--ink-soft)" />
        </Link>
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {STAGES.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < step ? "var(--leaf-500)" : i === step ? "var(--saffron-500)" : "var(--bg-deep)",
            }} />
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div className="eyebrow">Step {step + 1} · {STAGES[step].charAt(0).toUpperCase() + STAGES[step].slice(1)}</div>
          <div className="t-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>{title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-display" style={{ fontSize: 22, lineHeight: 1 }}>{vref}</div>
          <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-muted)", letterSpacing: "0.05em" }}>ACTS</div>
        </div>
      </div>
    </div>
  );
}
