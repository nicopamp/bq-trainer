export interface VerseForCue {
  id: number;
  text: string;
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns a map of verseId → cueText.
 * The cue is the shortest word prefix that uniquely identifies each verse
 * within the chapter. Comparison is case-insensitive with punctuation stripped.
 * Falls back to the full verse text for identical verses.
 */
export function computeVerseCues(verses: VerseForCue[]): Record<number, string> {
  const normalized = verses.map((v) => normalizeWords(v.text));
  const origWords = verses.map((v) => v.text.split(/\s+/).filter(Boolean));
  const result: Record<number, string> = {};

  for (let i = 0; i < verses.length; i++) {
    const words = normalized[i];
    let cueLen = 1;

    while (cueLen <= words.length) {
      const prefix = words.slice(0, cueLen).join(" ");
      const isUnique = normalized.every((other, j) => {
        if (j === i) return true;
        return other.slice(0, cueLen).join(" ") !== prefix;
      });
      if (isUnique) break;
      cueLen++;
    }

    result[verses[i].id] =
      cueLen > words.length
        ? verses[i].text
        : origWords[i].slice(0, cueLen).join(" ");
  }

  return result;
}
