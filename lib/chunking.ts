/**
 * Splits a KJV verse into recallable phrase chunks.
 * Splits on clause boundaries (commas, semicolons, colons), max 8 words per chunk.
 */
export function chunkVerse(text: string): string[] {
  // Split on punctuation boundaries while keeping the punctuation
  const raw = text
    .replace(/([,;:])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const segment of raw) {
    const words = segment.split(" ");
    if (words.length <= 8) {
      chunks.push(segment);
    } else {
      // break long segments at word 6
      for (let i = 0; i < words.length; i += 6) {
        const slice = words.slice(i, i + 6).join(" ");
        if (i + 6 < words.length) {
          chunks.push(slice);
        } else {
          chunks.push(slice);
        }
      }
    }
  }

  return chunks.length > 0 ? chunks : [text];
}
