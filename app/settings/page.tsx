"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/ui/BottomNav";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/ui/Mark";

export default function SettingsPage() {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const sections = [
    {
      title: "Study",
      items: [
        { label: "Daily session goal", value: "~15 min", icon: "target" },
        { label: "Default drill order", value: "Mixed", icon: "shuffle" },
        { label: "Chapters in scope", value: "Acts 1–9", icon: "book" },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Sign out", value: "", icon: "log-out", danger: true, action: handleSignOut },
      ],
    },
  ];

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
            <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Acts 1–9 · KJV · FSRS spaced repetition</div>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>{section.title}</div>
            <div className="card" style={{ overflow: "hidden" }}>
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={(item as any).action}
                  disabled={signingOut && (item as any).danger}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "none",
                    border: "none",
                    borderTop: i > 0 ? "1px solid var(--hairline)" : "none",
                    cursor: (item as any).action ? "pointer" : "default",
                    textAlign: "left",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: (item as any).danger ? "var(--rust-500)" : "var(--bg-deep)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={item.icon} size={16} color={(item as any).danger ? "#fff" : "var(--ink-soft)"} />
                  </div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: (item as any).danger ? "var(--rust-500)" : "var(--ink)" }}>
                    {(item as any).danger && signingOut ? "Signing out…" : item.label}
                  </span>
                  {item.value && (
                    <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{item.value}</span>
                  )}
                  {(item as any).action && <Icon name="chevron-right" size={16} color="var(--ink-muted)" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-muted)", marginTop: 8 }}>
          KJV text is public domain (US).<br />
          Scheduling powered by FSRS-4.5 via ts-fsrs.
        </p>
      </div>

      <BottomNav active="settings" />
    </div>
  );
}
