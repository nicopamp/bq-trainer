-- Rewrite every RLS policy with explicit USING + WITH CHECK clauses.
-- The prior policies used FOR ALL USING (...) without WITH CHECK, which
-- causes Postgres to fall back to the USING clause implicitly. The behavior
-- is correct but the intent is not obvious. This migration makes it explicit.
--
-- Also: revoke write privileges on verses from authenticated. The public
-- read-only nature of verses was previously implied by having only a SELECT
-- policy; this makes it structurally enforced.

-- user_verses
drop policy "own data only" on user_verses;
create policy "own data only" on user_verses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- reviews
drop policy "own data only" on reviews;
create policy "own data only" on reviews
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- sessions
drop policy "own data only" on sessions;
create policy "own data only" on sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- streaks
drop policy "own data only" on streaks;
create policy "own data only" on streaks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- events
drop policy "users manage own events" on events;
create policy "users manage own events" on events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- profiles
drop policy "users manage own profile" on profiles;
create policy "users manage own profile" on profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Structurally enforce that verses is read-only for authenticated users.
-- The existing SELECT policy stays; this revoke prevents any future code
-- path from inserting or mutating verse data as an authenticated user.
revoke insert, update, delete on verses from authenticated;
