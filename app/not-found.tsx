import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bqt-screen" style={{ justifyContent: "center", gap: "var(--s-4)" }}>
      <p className="eyebrow" style={{ color: "var(--ink-300)" }}>404</p>
      <p className="t-body" style={{ color: "var(--ink-400)", textAlign: "center", maxWidth: "280px" }}>
        This page doesn&apos;t exist.
      </p>
      <Link href="/home" className="btn btn-primary btn-md">
        Go home
      </Link>
    </div>
  );
}
