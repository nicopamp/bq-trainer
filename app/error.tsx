"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bqt-screen" style={{ justifyContent: "center", gap: "var(--s-4)" }}>
      <p className="eyebrow" style={{ color: "var(--rust-500)" }}>Something went wrong</p>
      <p className="t-body" style={{ color: "var(--ink-400)", textAlign: "center", maxWidth: "280px" }}>
        An unexpected error occurred. Your progress has been saved.
      </p>
      <button className="btn btn-primary btn-md" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
