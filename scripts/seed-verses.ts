/**
 * Seeds Acts 1–9 KJV text by scraping Bible Gateway's print interface.
 * Each verse is sourced directly from Bible Gateway so the wording exactly
 * matches the official version used in Bible Quiz competition.
 *
 * Setup:
 *   1. Add to .env.local:
 *        SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *   2. Run: npm run seed
 *
 * No Bible Gateway account or API key required.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { parseVerses } from "./seed-parser";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CHAPTER_VERSE_COUNTS: Record<number, number> = {
  1: 26, 2: 47, 3: 26, 4: 37, 5: 42,
  6: 15, 7: 60, 8: 40, 9: 43,
};

// ── Fetch ─────────────────────────────────────────────────────────────

async function fetchChapterHtml(chapter: number): Promise<string> {
  const url =
    `https://www.biblegateway.com/passage/` +
    `?search=Acts+${chapter}&version=KJV&interface=print`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; BibleQuizTrainer/1.0; one-time verse seeder)",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  return res.text();
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Acts 1–9 KJV from Bible Gateway…\n");
  let totalVerses = 0;
  let warnings = 0;

  for (const [chStr, expectedCount] of Object.entries(CHAPTER_VERSE_COUNTS)) {
    const chapter = Number(chStr);
    process.stdout.write(`  Acts ${chapter} (expected ${expectedCount} verses)… `);

    try {
      const html = await fetchChapterHtml(chapter);
      const verseMap = parseVerses(html, chapter);

      if (verseMap.size === 0) {
        throw new Error(
          "Parsed 0 verses — Bible Gateway may have changed its HTML structure. " +
          "Check the page manually."
        );
      }

      if (verseMap.size !== expectedCount) {
        console.log(
          `\n  ⚠  WARNING: parsed ${verseMap.size} verses, expected ${expectedCount}.` +
          `\n     Verify: https://www.biblegateway.com/passage/?search=Acts+${chapter}&version=KJV`
        );
        warnings++;
      }

      const rows = Array.from(verseMap.entries()).map(([verse, text]) => ({
        book: "Acts",
        chapter,
        verse,
        translation: "KJV",
        text,
      }));

      const { error } = await supabase
        .from("verses")
        .upsert(rows, { onConflict: "book,chapter,verse,translation" });

      if (error) throw error;

      const icon = verseMap.size === expectedCount ? "✓" : "⚠";
      console.log(`${icon} ${verseMap.size} verses`);
      totalVerses += verseMap.size;
    } catch (err) {
      console.log(`\n  ✗ FAILED: ${(err as Error).message}`);
      warnings++;
    }

    // Polite delay between requests
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Total: ${totalVerses} verses seeded from Bible Gateway KJV`);

  if (warnings > 0) {
    console.log(
      `\n⚠  ${warnings} issue(s) above require manual verification.\n` +
      `   Reference: https://www.biblegateway.com/passage/?search=Acts+1-9&version=KJV`
    );
    process.exit(1);
  } else {
    console.log("All verse counts match. Ready for competition use.");
  }
}

main().catch((err) => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
