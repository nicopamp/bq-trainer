/**
 * Splits a KJV verse into recallable phrase chunks.
 * Splits exclusively at clause boundaries (commas, semicolons, colons).
 * Long unpunctuated clauses are kept as a single chunk.
 */
export function chunkVerse(text: string): string[] {
  const chunks = text
    .replace(/([,;:])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return chunks.length > 0 ? chunks : [text];
}
