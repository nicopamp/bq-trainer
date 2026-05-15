export function safeNextPath(raw: string | null, fallback = "/home"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/^https?:\/\//i.test(raw) || /^javascript:/i.test(raw)) return fallback;
  return raw;
}
