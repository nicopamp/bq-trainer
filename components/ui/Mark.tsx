interface MarkProps { size?: number; }

export function Mark({ size = 26 }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--ink)" />
      <text x="16" y="22" textAnchor="middle"
        fontFamily="Fraunces, serif" fontWeight="600" fontSize="18"
        fill="var(--saffron-300)" fontStyle="italic">B</text>
      <line x1="9" y1="6" x2="13" y2="6" stroke="var(--saffron-300)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
