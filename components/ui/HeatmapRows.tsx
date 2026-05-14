"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HMCell } from "./HMCell";
import type { VerseState } from "@/lib/supabase/types";
import type { VerseStateMap } from "@/lib/home";

const OPTIMISTIC_KEY = "bqt_optimistic_states";

interface Props {
  serverVerseMap: VerseStateMap;
  chapterCounts: Record<number, number>;
}

export function HeatmapRows({ serverVerseMap, chapterCounts }: Props) {
  const [verseMap, setVerseMap] = useState<VerseStateMap>(serverVerseMap);

  useEffect(() => {
    let stored: Record<string, VerseState> = {};
    try {
      stored = JSON.parse(localStorage.getItem(OPTIMISTIC_KEY) || "{}");
    } catch {}

    if (Object.keys(stored).length === 0) return;

    const merged: VerseStateMap = {};
    for (const [chStr, verses] of Object.entries(serverVerseMap)) {
      merged[Number(chStr)] = { ...verses };
    }

    const toRemove: string[] = [];
    for (const [key, state] of Object.entries(stored)) {
      const [chStr, vStr] = key.split(":");
      const ch = Number(chStr);
      const v = Number(vStr);
      if (!ch || !v) { toRemove.push(key); continue; }

      const serverState = serverVerseMap[ch]?.[v];
      // Server data is up-to-date: clear the optimistic entry
      if (serverState === state || serverState === "mastered") {
        toRemove.push(key);
      } else {
        if (!merged[ch]) merged[ch] = {};
        merged[ch][v] = state;
      }
    }

    if (toRemove.length > 0) {
      const remaining = { ...stored };
      for (const k of toRemove) delete remaining[k];
      localStorage.setItem(OPTIMISTIC_KEY, JSON.stringify(remaining));
    }

    setVerseMap(merged);
  }, [serverVerseMap]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.entries(chapterCounts).map(([chStr, count]) => {
        const ch = Number(chStr);
        const verses = Array.from({ length: count }, (_, i) => verseMap[ch]?.[i + 1] ?? "new");
        const mastered = verses.filter((v) => v === "mastered" || v === "review").length;
        const pct = Math.round((mastered / count) * 100);
        return (
          <div key={ch} className="hm-row">
            <Link href={`/chapter/${ch}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="t-display" style={{ fontSize: 18, lineHeight: 1 }}>Ch. {ch}</div>
              <div className="t-mono" style={{ fontSize: 10, color: "var(--ink-muted)" }}>{count}v</div>
            </Link>
            <div className="hm-grid">
              {verses.map((lvl, vi) => (
                <HMCell key={vi} level={lvl} label={`${ch}:${vi + 1}`} href={`/learn/${ch}/${vi + 1}?from=home`} />
              ))}
            </div>
            <div className="t-mono" style={{ fontSize: 12, color: "var(--ink-soft)", textAlign: "right" }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}
