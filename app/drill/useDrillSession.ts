"use client";

import { useState, useCallback } from "react";
import { submitReview } from "@/lib/actions/reviews";
import type { DrillMode } from "@/lib/supabase/types";
import { shuffleRotation } from "@/lib/drillRotation";

type Mode = "audio" | "finish_it" | "type_out" | "ref_to_verse";

export interface DrillItemInput {
  verseId: number;
  book: string;
  chapter: number;
  verseNum: string | number;
  text: string;
  state: string;
  cueText: string;
}

export interface DrillItem extends DrillItemInput {
  mode: Mode;
}

export interface DrillSessionResult {
  grade: number;
  mode: string;
}

export interface ModeProgress {
  mode: Mode;
  total: number;
  completed: number;
  status: "done" | "active" | "queued";
}

export interface DrillSession {
  current: DrillItem;
  idx: number;
  total: number;
  progress: number;
  vref: string;
  results: DrillSessionResult[];
  done: boolean;
  modeProgress: ModeProgress[];
  handleResult: (grade: 1 | 2 | 3 | 4, transcript?: string, accuracy?: number) => Promise<void>;
}

export function useDrillSession(items: DrillItemInput[]): DrillSession {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<DrillSessionResult[]>([]);

  const [orderedItems] = useState<DrillItem[]>(() => {
    const order = localStorage.getItem("bqt_drill_order") ?? "mixed";
    const rotation = shuffleRotation(order) as Mode[];
    return items.map((item, i) => ({ ...item, mode: rotation[i % rotation.length] }));
  });

  const current = orderedItems[idx];

  const handleResult = useCallback(async (grade: 1 | 2 | 3 | 4, transcript?: string, accuracy?: number) => {
    setResults((r) => [...r, { grade, mode: current.mode }]);

    await submitReview({
      verseId: current.verseId,
      drillMode: current.mode as DrillMode,
      grade,
      transcript,
      accuracy,
    });

    if (idx + 1 >= orderedItems.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }, [current, idx, orderedItems.length]);

  // Derive per-mode progress in first-appearance order
  const seenModes: Mode[] = [];
  for (const item of orderedItems) {
    if (!seenModes.includes(item.mode)) seenModes.push(item.mode);
  }
  const currentMode = done ? undefined : orderedItems[idx]?.mode;
  const modeProgress: ModeProgress[] = seenModes.map(mode => {
    const total = orderedItems.filter(i => i.mode === mode).length;
    const completed = results.filter(r => r.mode === mode).length;
    const status: "done" | "active" | "queued" =
      completed === total ? "done" :
      mode === currentMode ? "active" :
      "queued";
    return { mode, total, completed, status };
  });

  return {
    current,
    idx,
    total: orderedItems.length,
    progress: idx / orderedItems.length,
    vref: `${current.chapter}:${current.verseNum}`,
    results,
    done,
    modeProgress,
    handleResult,
  };
}
