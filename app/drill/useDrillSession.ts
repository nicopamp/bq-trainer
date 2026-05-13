"use client";

import { useState, useCallback } from "react";
import { submitReview } from "@/lib/actions/reviews";
import type { DrillMode } from "@/lib/supabase/types";

type Mode = "audio" | "finish_it" | "type_out" | "ref_to_verse";

export interface DrillItemInput {
  verseId: number;
  book: string;
  chapter: number;
  verseNum: string | number;
  text: string;
  state: string;
}

export interface DrillItem extends DrillItemInput {
  mode: Mode;
}

export interface DrillSessionResult {
  grade: number;
  mode: string;
}

export interface DrillSession {
  current: DrillItem;
  idx: number;
  total: number;
  progress: number;
  vref: string;
  results: DrillSessionResult[];
  done: boolean;
  handleResult: (grade: 1 | 2 | 3 | 4, transcript?: string, accuracy?: number) => Promise<void>;
}

function getModeRotation(order: string): Mode[] {
  if (order === "audio")    return ["audio", "ref_to_verse", "finish_it", "type_out"];
  if (order === "type_out") return ["type_out", "finish_it", "ref_to_verse", "audio"];
  return ["audio", "finish_it", "type_out", "ref_to_verse"];
}

export function useDrillSession(items: DrillItemInput[]): DrillSession {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [results, setResults] = useState<DrillSessionResult[]>([]);

  const [orderedItems] = useState<DrillItem[]>(() => {
    const order = localStorage.getItem("bqt_drill_order") ?? "mixed";
    const rotation = getModeRotation(order);
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

  return {
    current,
    idx,
    total: orderedItems.length,
    progress: idx / orderedItems.length,
    vref: `${current.chapter}:${current.verseNum}`,
    results,
    done,
    handleResult,
  };
}
