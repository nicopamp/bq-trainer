"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/ui/Mark";
import { Icon } from "@/components/ui/Icon";

const STEPS = [
  {
    title: "Memorize Acts 1–9",
    body: "Built for Bible Quiz competition. Every verse in Acts 1–9 (KJV), designed for instant recall by verse number.",
    icon: "book",
  },
  {
    title: "Learn with science",
    body: "A 5-step memorization ladder (read → chunk → trace → recall → graduate) puts each verse into your long-term memory.",
    icon: "sparkles",
  },
  {
    title: "Review smartly",
    body: "FSRS spaced repetition shows you each verse exactly when you're about to forget it — no wasted reviews.",
    icon: "chart",
  },
  {
    title: "Four drill modes",
    body: "Audio recognition, finish-it, type-out, and ref-to-verse drills keep your memory sharp from every angle.",
    icon: "mic",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="bqt-screen" style={{ justifyContent: "space-between" }}>
      <div className="paper-grain" />

      <div style={{ padding: "40px 28px 0", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <Mark size={48} />

        {/* step indicator */}
        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? "var(--saffron-500)" : "var(--hairline)", transition: "width 200ms" }} />
          ))}
        </div>

        {/* icon */}
        <div style={{ width: 96, height: 96, borderRadius: 28, background: "var(--saffron-50)", border: "1px solid var(--saffron-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={current.icon} size={44} color="var(--saffron-500)" strokeWidth={1.4} />
        </div>

        <div style={{ textAlign: "center" }}>
          <div className="t-display" style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}>{current.title}</div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: 300 }}>{current.body}</p>
        </div>
      </div>

      <div style={{ padding: "24px 28px 40px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => {
          if (isLast) router.push("/home");
          else setStep(step + 1);
        }}>
          {isLast ? "Get started" : "Next"}
          <Icon name="chevron-right" size={18} color="var(--bg)" />
        </button>
        {!isLast && (
          <button className="btn btn-ghost btn-md" style={{ width: "100%" }} onClick={() => router.push("/home")}>
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}
