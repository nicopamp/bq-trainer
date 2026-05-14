/**
 * Pre-generates MP3 audio files for all Acts 1–9 KJV verses using OpenAI TTS.
 * Output: public/audio/acts_{chapter}_{verse}.mp3
 *
 * Usage: npm run generate-audio
 * Requires: OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Cost: ~$2–3 one-time for all 336 verses at $15/1M chars (tts-1 model).
 * Re-running skips files that already exist.
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { computeVerseCues } from "../lib/verseCue";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const outputDir = path.join(process.cwd(), "public", "audio");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const { data: verses, error } = await supabase
    .from("verses")
    .select("id, chapter, verse, text")
    .eq("book", "Acts")
    .eq("translation", "KJV")
    .order("chapter")
    .order("verse");

  if (error || !verses) {
    console.error("Failed to fetch verses:", error);
    process.exit(1);
  }

  // ── Pass 1: full-verse MP3s ───────────────────────────────────────
  console.log(`Pass 1: full-verse audio for ${verses.length} verses…`);
  let generated = 0;
  let skipped = 0;

  for (const v of verses) {
    const filename = `acts_${v.chapter}_${v.verse}.mp3`;
    const filepath = path.join(outputDir, filename);

    if (fs.existsSync(filepath)) {
      skipped++;
      continue;
    }

    try {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: v.text,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      generated++;
      process.stdout.write(`\r  ${generated} generated, ${skipped} skipped (Acts ${v.chapter}:${v.verse})  `);

      // Throttle to stay within OpenAI rate limits
      await sleep(120);
    } catch (err: any) {
      console.error(`\n  ✗ acts_${v.chapter}_${v.verse}.mp3:`, err?.message ?? err);
    }
  }

  console.log(`\nPass 1 done! ${generated} generated, ${skipped} skipped.`);

  // ── Pass 2: cue MP3s + cues.json manifest ─────────────────────────
  console.log(`\nPass 2: computing Verse Cues…`);

  // Group by chapter and compute cue texts
  const byChapter: Record<number, { id: number; chapter: number; verse: number; text: string }[]> = {};
  for (const v of verses) {
    (byChapter[v.chapter] ??= []).push(v);
  }

  const cueManifest: Record<string, string> = {};
  for (const [ch, chVerses] of Object.entries(byChapter)) {
    const cueMap = computeVerseCues(chVerses);
    for (const v of chVerses) {
      cueManifest[`${ch}_${v.verse}`] = cueMap[v.id] ?? v.text.split(/\s+/)[0] ?? v.text;
    }
  }

  const manifestPath = path.join(outputDir, "cues.json");
  fs.writeFileSync(manifestPath, JSON.stringify(cueManifest, null, 2));
  console.log(`  cues.json written with ${Object.keys(cueManifest).length} entries.`);

  console.log(`\nPass 2: generating cue audio…`);
  let cueGenerated = 0;
  let cueSkipped = 0;

  for (const v of verses) {
    const filename = `acts_${v.chapter}_${v.verse}_cue.mp3`;
    const filepath = path.join(outputDir, filename);

    if (fs.existsSync(filepath)) {
      cueSkipped++;
      continue;
    }

    const cueText = cueManifest[`${v.chapter}_${v.verse}`] ?? v.text;

    try {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: cueText,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(filepath, buffer);
      cueGenerated++;
      process.stdout.write(`\r  ${cueGenerated} generated, ${cueSkipped} skipped (Acts ${v.chapter}:${v.verse} cue: "${cueText}")  `);

      await sleep(120);
    } catch (err: any) {
      console.error(`\n  ✗ acts_${v.chapter}_${v.verse}_cue.mp3:`, err?.message ?? err);
    }
  }

  console.log(`\nPass 2 done! ${cueGenerated} generated, ${cueSkipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
