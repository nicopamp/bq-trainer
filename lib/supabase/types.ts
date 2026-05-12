export type VerseState = "new" | "learning" | "review" | "mastered" | "stale";
export type DrillMode = "audio" | "finish_it" | "type_out" | "ref_to_verse";

export interface Verse {
  id: number;
  book: string;
  chapter: number;
  verse: number;
  translation: string;
  text: string;
}

export interface UserVerse {
  user_id: string;
  verse_id: number;
  state: VerseState;
  learn_step: number;
  stability: number | null;
  difficulty: number | null;
  due_at: string | null;
  last_reviewed_at: string | null;
  reps: number;
  lapses: number;
}

export interface Review {
  id: number;
  user_id: string;
  verse_id: number;
  drill_mode: DrillMode;
  grade: 1 | 2 | 3 | 4;
  duration_ms: number | null;
  transcript: string | null;
  accuracy: number | null;
  created_at: string;
}

export interface Session {
  id: number;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  total_reviews: number;
  accuracy: number | null;
}

export interface Streak {
  user_id: string;
  current_days: number;
  best_days: number;
  last_day: string | null;
}

export interface Event {
  id: number;
  user_id: string;
  name: string;
  date: string; // ISO date string "YYYY-MM-DD"
  end_chapter: number;
  created_at: string;
}

// Joined type returned by home/chapter queries
export interface VerseWithState extends Verse {
  state: VerseState;
  learn_step: number;
  due_at: string | null;
  stability: number | null;
}
