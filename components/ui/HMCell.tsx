import type { VerseState } from "@/lib/supabase/types";

interface HMCellProps {
  level: VerseState;
  current?: boolean;
  label?: string;
  size?: number;
  onClick?: () => void;
}

export function HMCell({ level, current = false, label, size, onClick }: HMCellProps) {
  return (
    <div
      className={`hm-cell lvl-${level}`}
      title={label}
      onClick={onClick}
      style={{
        ...(size ? { width: size, height: size } : {}),
        boxShadow: current ? "0 0 0 2px var(--ink), 0 0 0 4px var(--saffron-500)" : "none",
        cursor: onClick ? "pointer" : "default",
      }}
    />
  );
}
