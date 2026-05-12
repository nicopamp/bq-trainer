"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mark } from "@/components/ui/Mark";
import { Icon } from "@/components/ui/Icon";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/home"), 2000);
    }
  }

  return (
    <div className="bqt-screen" style={{ justifyContent: "center", padding: "40px 28px" }}>
      <div className="paper-grain" />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Mark size={48} />
          <div>
            <h1 className="t-display" style={{ fontSize: 24, textAlign: "center", lineHeight: 1.1 }}>
              {done ? "Password set!" : "Set your password"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-muted)", textAlign: "center", marginTop: 6, lineHeight: 1.4 }}>
              {done ? "Redirecting you home…" : "You'll be able to sign in with email and password going forward."}
            </p>
          </div>
        </div>

        {done ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: "var(--leaf-500)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={28} color="#fff" strokeWidth={2.4} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              style={inputStyle}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              style={inputStyle}
            />

            {error && (
              <p style={{ fontSize: 13, color: "var(--rust-500)", textAlign: "center" }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? "Saving…" : "Set password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
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
};
