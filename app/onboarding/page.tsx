"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/ui/Mark";
import { Icon } from "@/components/ui/Icon";
import { createProfile } from "@/lib/actions/profile";
import { isProfileComplete } from "@/lib/onboarding";

const SLIDES = [
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
    body: "Spaced repetition shows you each verse exactly when you're about to forget it — no wasted reviews.",
    icon: "chart",
  },
  {
    title: "Four drill modes",
    body: "Audio recognition, finish-it, type-out, and ref-to-verse drills keep your memory sharp from every angle.",
    icon: "mic",
  },
];

const PROFILE_STEP = SLIDES.length; // index 4
const TOTAL_STEPS = SLIDES.length + 1; // 5

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [quizCategory, setQuizCategory] = useState<"TBQ" | "EABQ" | "">("");
  const [church, setChurch] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isSlide = step < PROFILE_STEP;
  const isLast = step === SLIDES.length - 1;
  const current = isSlide ? SLIDES[step] : null;

  const profileReady = isProfileComplete({ fullName, quizCategory, church });

  function handleNext() {
    if (isLast) setStep(PROFILE_STEP);
    else setStep(step + 1);
  }

  function handleSubmit() {
    if (!profileReady || isPending) return;
    startTransition(async () => {
      await createProfile({
        fullName,
        quizCategory: quizCategory as "TBQ" | "EABQ",
        church,
      });
      router.push("/home");
    });
  }

  return (
    <div className="bqt-screen" style={{ justifyContent: "space-between" }}>
      <div className="paper-grain" />

      <div style={{ padding: "40px 28px 0", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <Mark size={48} />

        {/* step indicator — 5 dots */}
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? "var(--saffron-500)" : "var(--hairline)", transition: "width 200ms" }} />
          ))}
        </div>

        {isSlide && current ? (
          <>
            {/* icon */}
            <div style={{ width: 96, height: 96, borderRadius: 28, background: "var(--saffron-50)", border: "1px solid var(--saffron-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={current.icon} size={44} color="var(--saffron-500)" strokeWidth={1.4} />
            </div>

            <div style={{ textAlign: "center" }}>
              <div className="t-display" style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}>{current.title}</div>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)", maxWidth: 300 }}>{current.body}</p>
            </div>
          </>
        ) : (
          /* profile form */
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div className="t-display" style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 8 }}>One last thing</div>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-soft)" }}>Tell us a bit about yourself.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Full name</span>
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--bg-card)", fontSize: 15, color: "var(--ink)", outline: "none" }}
                />
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Quiz category</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["TBQ", "EABQ"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setQuizCategory(cat)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 10,
                        border: `1px solid ${quizCategory === cat ? "var(--saffron-500)" : "var(--hairline)"}`,
                        background: quizCategory === cat ? "var(--saffron-50)" : "var(--bg-card)",
                        color: quizCategory === cat ? "var(--saffron-500)" : "var(--ink-soft)",
                        fontWeight: quizCategory === cat ? 600 : 400,
                        fontSize: 15,
                        cursor: "pointer",
                        transition: "all 150ms",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Church</span>
                <input
                  type="text"
                  placeholder="Your church"
                  value={church}
                  onChange={(e) => setChurch(e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--hairline)", background: "var(--bg-card)", fontSize: 15, color: "var(--ink)", outline: "none" }}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "24px 28px 40px", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {isSlide ? (
          <>
            <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={handleNext}>
              Next
              <Icon name="chevron-right" size={18} color="var(--bg)" />
            </button>
            <button className="btn btn-ghost btn-md" style={{ width: "100%" }} onClick={() => setStep(PROFILE_STEP)}>
              Skip intro
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%" }}
            disabled={!profileReady || isPending}
            onClick={handleSubmit}
          >
            {isPending ? "Saving…" : "Get started"}
            {!isPending && <Icon name="chevron-right" size={18} color="var(--bg)" />}
          </button>
        )}
      </div>
    </div>
  );
}
