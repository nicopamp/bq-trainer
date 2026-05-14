"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mark } from "@/components/ui/Mark";
import { Icon } from "@/components/ui/Icon";

type AuthTab = "magic" | "password";
type PasswordMode = "signin" | "reset";

export default function AuthPage() {
  const [tab, setTab] = useState<AuthTab>("magic");

  return (
    <div className="bqt-screen" style={{ justifyContent: "center", padding: "40px 28px" }}>
      <div className="paper-grain" />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 28 }}>
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

        {/* tab switcher */}
        <div style={{ display: "flex", background: "var(--bg-deep)", borderRadius: "var(--r-md)", padding: 4, gap: 4 }}>
          {(["magic", "password"] as AuthTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: 40, borderRadius: "calc(var(--r-md) - 2px)",
                border: "none", cursor: "pointer",
                background: tab === t ? "var(--paper)" : "transparent",
                boxShadow: tab === t ? "var(--sh-1)" : "none",
                fontSize: 14, fontFamily: "var(--font-body)",
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? "var(--ink)" : "var(--ink-muted)",
                transition: "all 150ms",
              }}
            >
              {t === "magic" ? "Magic link" : "Password"}
            </button>
          ))}
        </div>

        {tab === "magic" ? <MagicLinkForm /> : <PasswordForm />}
      </div>
    </div>
  );
}

// ── Magic link form ────────────────────────────────────────────────
function MagicLinkForm() {
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

  if (sent) {
    return (
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
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
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
  );
}

// ── Password form ──────────────────────────────────────────────────
function PasswordForm() {
  const [mode, setMode] = useState<PasswordMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/home");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?type=recovery`,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
    setLoading(false);
  }

  if (resetSent) {
    return (
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: "var(--leaf-500)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
          <Icon name="mail" size={28} color="#fff" />
        </div>
        <div className="t-display" style={{ fontSize: 22 }}>Check your email</div>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.5 }}>
          We sent a password link to <strong>{email}</strong>.<br />
          Click it to set your password — works for both new and existing accounts.
        </p>
        <button className="btn btn-ghost btn-md" style={{ margin: "8px auto 0" }} onClick={() => { setResetSent(false); setMode("signin"); }}>
          Back to sign in
        </button>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="eyebrow" style={{ textAlign: "center" }}>Set or reset your password</div>
        <p style={{ fontSize: 13, color: "var(--ink-muted)", textAlign: "center", lineHeight: 1.4 }}>
          Enter your email and we&apos;ll send a link to set your password. Works even if you signed up with a magic link.
        </p>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          style={inputStyle}
        />
        {error && <p style={{ fontSize: 13, color: "var(--rust-500)", textAlign: "center" }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading || !email}>
          {loading ? "Sending…" : (
            <><Icon name="mail" size={16} color="var(--bg)" /> Send password link</>
          )}
        </button>
        <button type="button" className="btn btn-ghost btn-md" style={{ width: "100%" }} onClick={() => { setMode("signin"); setError(null); }}>
          Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="eyebrow" style={{ textAlign: "center" }}>Sign in with email & password</div>
      <input
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={inputStyle}
      />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        style={inputStyle}
      />
      {error && <p style={{ fontSize: 13, color: "var(--rust-500)", textAlign: "center" }}>{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading || !email || !password}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <button type="button" className="btn btn-ghost btn-md" style={{ width: "100%" }} onClick={() => { setMode("reset"); setError(null); }}>
        Forgot or need to set a password?
      </button>
    </form>
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
