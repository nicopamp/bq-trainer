-- ─────────────────────────────────────────────────────────────────────────────
-- supabase/setup.sql
-- Full schema bootstrap for a fresh bq-trainer Supabase project.
-- Run once in the SQL editor after creating the project.
-- After running this, seed verse text with: npm run seed
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.verses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  book        TEXT    NOT NULL,
  chapter     INTEGER NOT NULL,
  verse       INTEGER NOT NULL,
  translation TEXT    NOT NULL,
  text        TEXT    NOT NULL,
  UNIQUE (book, chapter, verse, translation)
);

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

CREATE TABLE IF NOT EXISTS public.sessions (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  total_reviews  INTEGER     NOT NULL DEFAULT 0,
  accuracy       NUMERIC
);

CREATE TABLE IF NOT EXISTS public.streaks (
  user_id      UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_days INTEGER NOT NULL DEFAULT 0,
  best_days    INTEGER NOT NULL DEFAULT 0,
  last_day     DATE
);

CREATE TABLE IF NOT EXISTS public.events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  date        DATE    NOT NULL,
  end_chapter INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_user_date
  ON public.events (user_id, date);

-- ── Row-level security ────────────────────────────────────────────────────────

ALTER TABLE public.verses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verses_select"
  ON public.verses FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_verses_select"
  ON public.user_verses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_verses_insert"
  ON public.user_verses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_verses_update"
  ON public.user_verses FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "reviews_select"
  ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reviews_insert"
  ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_select"
  ON public.sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert"
  ON public.sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update"
  ON public.sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "streaks_select"
  ON public.streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "streaks_insert"
  ON public.streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "streaks_update"
  ON public.streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "events_all"
  ON public.events FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── Trigger: provision rows for new users ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_verses (user_id, verse_id, state, learn_step, reps, lapses)
  SELECT NEW.id, id, 'new', 0, 0, 0
  FROM public.verses
  ON CONFLICT (user_id, verse_id) DO NOTHING;

  INSERT INTO public.streaks (user_id, current_days, best_days)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
