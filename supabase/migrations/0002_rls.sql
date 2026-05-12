-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_rls.sql
-- Row-Level Security policies. Run after 0001_schema.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── verses: readable by all authenticated users (static data) ─────────────────
ALTER TABLE public.verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verses_select"
  ON public.verses FOR SELECT
  TO authenticated
  USING (true);

-- ── user_verses: users see and modify only their own rows ─────────────────────
ALTER TABLE public.user_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_verses_select"
  ON public.user_verses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_verses_insert"
  ON public.user_verses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_verses_update"
  ON public.user_verses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── reviews: users see and insert only their own rows ────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "reviews_insert"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── sessions: users see and modify only their own rows ───────────────────────
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── streaks: users see and modify only their own row ─────────────────────────
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks_select"
  ON public.streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "streaks_upsert"
  ON public.streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks_update"
  ON public.streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
