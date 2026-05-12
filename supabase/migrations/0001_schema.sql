-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_schema.sql
-- Core tables for bq-trainer: verses, user_verses, reviews, sessions, streaks
-- Run this in Supabase SQL editor (or via Supabase CLI) on any new project.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── verses ────────────────────────────────────────────────────────────────────
-- Static KJV text. Populated once via `npm run seed`.
CREATE TABLE IF NOT EXISTS public.verses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book        TEXT    NOT NULL,
  chapter     INTEGER NOT NULL,
  verse       INTEGER NOT NULL,
  translation TEXT    NOT NULL,
  text        TEXT    NOT NULL,
  UNIQUE (book, chapter, verse, translation)
);

-- ── user_verses ───────────────────────────────────────────────────────────────
-- Per-user FSRS state for every verse. Rows are auto-created by trigger below.
CREATE TABLE IF NOT EXISTS public.user_verses (
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id          BIGINT      NOT NULL REFERENCES public.verses(id) ON DELETE CASCADE,
  state             TEXT        NOT NULL DEFAULT 'new'
                    CHECK (state IN ('new', 'learning', 'review', 'mastered', 'stale')),
  learn_step        INTEGER     NOT NULL DEFAULT 0,
  stability         NUMERIC,
  difficulty        NUMERIC,
  due_at            TIMESTAMPTZ,
  last_reviewed_at  TIMESTAMPTZ,
  reps              INTEGER     NOT NULL DEFAULT 0,
  lapses            INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, verse_id)
);

CREATE INDEX IF NOT EXISTS user_verses_user_due
  ON public.user_verses (user_id, due_at)
  WHERE state IN ('review', 'mastered', 'learning');

-- ── reviews ───────────────────────────────────────────────────────────────────
-- Audit log of every drill result.
CREATE TABLE IF NOT EXISTS public.reviews (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id    BIGINT      NOT NULL REFERENCES public.verses(id) ON DELETE CASCADE,
  drill_mode  TEXT        NOT NULL
              CHECK (drill_mode IN ('audio', 'finish_it', 'type_out', 'ref_to_verse')),
  grade       INTEGER     NOT NULL CHECK (grade BETWEEN 1 AND 4),
  duration_ms INTEGER,
  transcript  TEXT,
  accuracy    NUMERIC,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_user_created
  ON public.reviews (user_id, created_at DESC);

-- ── sessions ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  total_reviews  INTEGER     NOT NULL DEFAULT 0,
  accuracy       NUMERIC
);

-- ── streaks ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_days INTEGER NOT NULL DEFAULT 0,
  best_days    INTEGER NOT NULL DEFAULT 0,
  last_day     DATE
);
