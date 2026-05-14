import Link from "next/link";
import type { VerseState } from "@/lib/supabase/types";

interface HMCellProps {
  level: VerseState;
  current?: boolean;
  label?: string;
  size?: number;
  onClick?: () => void;
  href?: string;
}

export function HMCell({ level, current = false, label, size, onClick, href }: HMCellProps) {
  const style = {
    ...(size ? { width: size, height: size } : {}),
    boxShadow: current ? "0 0 0 2px var(--ink), 0 0 0 4px var(--saffron-500)" : "none",
    cursor: href || onClick ? "pointer" : "default",
    display: "block",
  };

  if (href) {
    return (
      <Link
        href={href}
        className={`hm-cell lvl-${level}`}
        title={label}
        style={style}
      />
    );
  }

  return (
    <div
      className={`hm-cell lvl-${level}`}
      title={label}
      onClick={onClick}
      style={style}
    />
  );
}
