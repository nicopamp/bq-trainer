"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mark } from "@/components/ui/Mark";
import { Icon } from "@/components/ui/Icon";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="bqt-screen" style={{ justifyContent: "center", padding: "40px 28px" }}>
      <div className="paper-grain" />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
        {/* brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Mark size={48} />
          <div>
            <h1 className="t-display" style={{ fontSize: 28, textAlign: "center", lineHeight: 1.1 }}>
              Bible Quiz Trainer
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", textAlign: "center", marginTop: 6, lineHeight: 1.4 }}>
              Memorize Acts 1–9 with spaced repetition
            </p>
          </div>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="eyebrow" style={{ textAlign: "center" }}>Sign in with a magic link</div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={{
                height: 52,
                padding: "0 18px",
                background: "var(--paper)",
                border: "1px solid var(--hairline)",
                borderRadius: "var(--r-md)",
                fontSize: 16,
                fontFamily: "var(--font-body)",
                color: "var(--ink)",
                outline: "none",
                width: "100%",
              }}
            />

            {error && (
              <p style={{ fontSize: 13, color: "var(--rust-500)", textAlign: "center" }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={loading || !email}
            >
              {loading ? "Sending…" : (
                <>
                  <Icon name="mail" size={16} color="var(--bg)" />
                  Send magic link
                </>
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: "var(--leaf-500)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <Icon name="mail" size={28} color="#fff" />
            </div>
            <div className="t-display" style={{ fontSize: 22 }}>Check your email</div>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              We sent a magic link to <strong>{email}</strong>.<br />
              Click it to sign in — no password needed.
            </p>
            <button
              className="btn btn-ghost btn-md"
              style={{ margin: "8px auto 0" }}
              onClick={() => { setSent(false); setEmail(""); }}
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
