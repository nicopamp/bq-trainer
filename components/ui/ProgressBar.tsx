interface ProgressBarProps {
  value: number; // 0–1
  height?: number;
  accent?: string;
}

export function ProgressBar({ value, height = 8, accent = "var(--saffron-500)" }: ProgressBarProps) {
  return (
    <div style={{ height, background: "var(--bg-deep)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min(1, Math.max(0, value)) * 100}%`,
        height: "100%",
        background: accent,
        borderRadius: 999,
        transition: "width 300ms ease",
      }} />
    </div>
  );
}
