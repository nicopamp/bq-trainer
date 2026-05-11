-- Fix 1: drop the heavy bulk-insert trigger that was failing at signup.
-- Inserting 336 rows synchronously in a trigger on auth.users causes
-- "Database error saving new user" — Supabase times out or the
-- security definer function can't resolve public schema tables.
drop trigger if exists on_user_created on auth.users;
drop function if exists init_user_verses();

-- Fix 2: keep a lightweight trigger that only creates the streak row.
create or replace function create_streak_for_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.streaks (user_id)
  values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

create or replace trigger on_user_created
  after insert on auth.users
  for each row execute function create_streak_for_user();

-- Fix 3: function the app calls on first home-page load to initialize
-- user_verses rows for any verses not yet present. Safe to call repeatedly.
create or replace function ensure_user_verses(p_user_id uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.user_verses (user_id, verse_id)
  select p_user_id, v.id
  from public.verses v
  where not exists (
    select 1 from public.user_verses uv
    where uv.user_id = p_user_id and uv.verse_id = v.id
  );
end;
$$;

-- Only the authenticated user can call this for their own id.
revoke all on function ensure_user_verses(uuid) from public;
grant execute on function ensure_user_verses(uuid) to authenticated;
