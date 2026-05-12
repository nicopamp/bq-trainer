"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/ui/BottomNav";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Mark";

const GOAL_OPTIONS = [
  { label: "~5 min", value: 5 },
  { label: "~10 min", value: 10 },
  { label: "~15 min", value: 15 },
  { label: "~20 min", value: 20 },
  { label: "~30 min", value: 30 },
];

const DRILL_ORDER_OPTIONS = [
  { label: "Mixed", value: "mixed" },
  { label: "Audio first", value: "audio" },
  { label: "Type-out first", value: "type_out" },
];

export default function SettingsPage() {
  const [signingOut, setSigningOut] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [drillOrder, setDrillOrder] = useState("mixed");
  const router = useRouter();

  useEffect(() => {
    const goal = localStorage.getItem("bqt_daily_goal");
    const order = localStorage.getItem("bqt_drill_order");
    if (goal) setDailyGoal(Number(goal));
    if (order) setDrillOrder(order);
  }, []);

  const handleGoalChange = (value: number) => {
    setDailyGoal(value);
    localStorage.setItem("bqt_daily_goal", String(value));
  };

  const handleDrillOrderChange = (value: string) => {
    setDrillOrder(value);
    localStorage.setItem("bqt_drill_order", value);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const goalLabel = GOAL_OPTIONS.find((o) => o.value === dailyGoal)?.label ?? `~${dailyGoal} min`;
  const orderLabel = DRILL_ORDER_OPTIONS.find((o) => o.value === drillOrder)?.label ?? "Mixed";

  return (
    <div className="bqt-screen">
      <div className="paper-grain" />

      <div style={{ padding: "14px 22px 10px", position: "relative", zIndex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Bible Quiz Trainer</div>
        <div className="t-display" style={{ fontSize: 30, lineHeight: 1 }}>Settings</div>
      </div>

      <div className="screen-scroll" style={{ padding: "0 22px 22px", position: "relative", zIndex: 1 }}>
        {/* app info */}
        <div className="card" style={{ padding: 18, marginBottom: 22, display: "flex", alignItems: "center", gap: 14 }}>
          <Mark size={40} />
          <div>
            <div className="t-display" style={{ fontSize: 18 }}>Bible Quiz Trainer</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Acts 1–9 · KJV · Spaced repetition</div>
          </div>
        </div>

        {/* Study section */}
        <div style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Study</div>
          <div className="card" style={{ overflow: "hidden" }}>
            {/* Daily goal */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--hairline)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="target" size={16} color="var(--ink-soft)" />
                </div>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>Daily session goal</span>
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{goalLabel}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {GOAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleGoalChange(opt.value)}
                    className={dailyGoal === opt.value ? "chip chip-mono" : "chip"}
                    style={{
                      background: dailyGoal === opt.value ? "var(--saffron-500)" : "var(--bg-deep)",
                      color: dailyGoal === opt.value ? "#fff" : "var(--ink-muted)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drill order */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--hairline)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="shuffle" size={16} color="var(--ink-soft)" />
                </div>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>Default drill order</span>
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{orderLabel}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DRILL_ORDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleDrillOrderChange(opt.value)}
                    className={drillOrder === opt.value ? "chip chip-mono" : "chip"}
                    style={{
                      background: drillOrder === opt.value ? "var(--saffron-500)" : "var(--bg-deep)",
                      color: drillOrder === opt.value ? "#fff" : "var(--ink-muted)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Competition Season */}
            <button
              onClick={() => router.push("/settings/events")}
              style={{
                width: "100%", padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
                borderBottom: "1px solid var(--hairline)",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="calendar" size={16} color="var(--ink-soft)" />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>Competition Season</span>
              <Icon name="chevron-right" size={16} color="var(--ink-muted)" />
            </button>

            {/* Chapters (read-only) */}
            <button
              disabled
              style={{
                width: "100%", padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
                background: "none", border: "none", cursor: "default", textAlign: "left",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="book" size={16} color="var(--ink-soft)" />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>Chapters in scope</span>
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Acts 1–9</span>
            </button>
          </div>
        </div>

        {/* Account section */}
        <div style={{ marginBottom: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Account</div>
          <div className="card" style={{ overflow: "hidden" }}>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{
                width: "100%", padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
                background: "none", border: "none", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--rust-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="log-out" size={16} color="#fff" />
              </div>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "var(--rust-500)" }}>
                {signingOut ? "Signing out…" : "Sign out"}
              </span>
              <Icon name="chevron-right" size={16} color="var(--ink-muted)" />
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-muted)", marginTop: 8 }}>
          KJV text is public domain (US).<br />
          Scheduling adapts to your memory.
        </p>
      </div>

      <BottomNav active="settings" />
    </div>
  );
}
