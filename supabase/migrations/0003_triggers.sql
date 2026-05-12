-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_triggers.sql
-- Auto-provision user_verses and streaks rows when a new user signs up.
-- Run after 0001_schema.sql and 0002_rls.sql.
--
-- IMPORTANT: This trigger runs as SECURITY DEFINER (service role) so it can
-- write to user_verses even before RLS would allow it for the new user.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create a user_verses row (state=new) for every verse that exists at sign-up time
  INSERT INTO public.user_verses (user_id, verse_id, state, learn_step, reps, lapses)
  SELECT NEW.id, id, 'new', 0, 0, 0
  FROM public.verses
  ON CONFLICT (user_id, verse_id) DO NOTHING;

  -- Seed an empty streak record
  INSERT INTO public.streaks (user_id, current_days, best_days)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Fire after every new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
