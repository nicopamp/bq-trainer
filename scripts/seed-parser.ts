/**
 * Pure parsing utilities extracted from seed-verses.ts so they can be unit-tested.
 */

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
};

export function stripHtml(html: string): string {
  // Handle > inside quoted attribute values to avoid leaving tag fragments as text.
  // CodeQL js/incomplete-multi-character-sanitization: <[^>]+> stops at the first >
  // inside a value like alt="a>b", leaving 'b">' in the output.
  const noTags = html.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, "");

  // Decode all entities in a single pass — a sequential chain like
  // &amp;→& then &lt;→< would incorrectly turn &amp;lt; into <.
  // CodeQL js/double-escaping: sequential chained replaces cause this.
  return noTags
    .replace(/&(?:([a-z]+)|#(\d+)|#x([\da-f]+));/gi, (match, name, dec, hex) => {
      if (name) return NAMED_ENTITIES[name.toLowerCase()] ?? match;
      if (dec) return String.fromCharCode(Number(dec));
      return String.fromCharCode(parseInt(hex, 16));
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts verse text from Bible Gateway's print HTML for the given chapter.
 *
 * Structure (confirmed from live page):
 *   <span id="en-KJV-NNNNN" class="text Acts-{ch}-{v}">
 *     <span class="chapternum">1 </span>   ← only on verse 1
 *     <sup class="versenum">2 </sup>        ← verses 2+
 *     Verse text goes here...
 *   </span>
 *
 * Strategy: split on </p> so each paragraph (= one verse) is processed
 * independently. Within each paragraph, locate the opening span tag by its
 * class, take everything after the tag's closing >, then strip verse-number
 * elements and all remaining HTML.
 *
 * We cannot use a lazy span regex ([\s\S]*?<\/span>) because verse 1 has a
 * nested <span class="chapternum"> whose </span> would be matched first,
 * cutting off the actual verse text.
 */
export function parseVerses(html: string, chapter: number): Map<number, string> {
  const verses = new Map<number, string>();
  const verseClassRe = new RegExp(`\\btext Acts-${chapter}-(\\d+)\\b`);

  for (const para of html.split("</p>")) {
    const classMatch = verseClassRe.exec(para);
    if (!classMatch) continue;

    const verseNum = parseInt(classMatch[1], 10);

    const spanTagStart = para.search(/class="[^"]*\btext Acts-/);
    if (spanTagStart === -1) continue;
    const openTagEnd = para.indexOf(">", spanTagStart);
    if (openTagEnd === -1) continue;

    let content = para.slice(openTagEnd + 1);

    content = content
      .replace(/<span\b[^>]*class="[^"]*chapternum[^"]*"[^>]*>[\s\S]*?<\/span>/g, "")
      .replace(/<sup\b[^>]*class="[^"]*versenum[^"]*"[^>]*>[\s\S]*?<\/sup>/g, "")
      .replace(/<sup\b[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/sup>/g, "")
      .replace(/<sup\b[^>]*data-fn[^>]*>[\s\S]*?<\/sup>/g, "")
      .replace(/<a\b[^>]*class="[^"]*crossreference[^"]*"[^>]*>[\s\S]*?<\/a>/g, "");

    const text = stripHtml(content);
    if (text) verses.set(verseNum, text);
  }

  return verses;
}
