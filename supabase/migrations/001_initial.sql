-- Bible Quiz Trainer — initial schema
-- Run: supabase db push

-- ── Verse reference data ───────────────────────────────────────────
create table if not exists verses (
  id          bigserial primary key,
  book        text        not null default 'Acts',
  chapter     smallint    not null,
  verse       smallint    not null,
  translation text        not null default 'KJV',
  text        text        not null,
  unique (book, chapter, verse, translation)
);

-- ── Per-user verse state ───────────────────────────────────────────
create type verse_state as enum ('new', 'learning', 'review', 'mastered', 'stale');

create table if not exists user_verses (
  user_id          uuid         not null references auth.users(id) on delete cascade,
  verse_id         bigint       not null references verses(id) on delete cascade,
  state            verse_state  not null default 'new',
  learn_step       smallint     not null default 0, -- 0-4 within Learn flow
  -- FSRS-4.5 fields
  stability        real,
  difficulty       real,
  due_at           timestamptz,
  last_reviewed_at timestamptz,
  reps             int          not null default 0,
  lapses           int          not null default 0,
  primary key (user_id, verse_id)
);

create index if not exists user_verses_due on user_verses (user_id, due_at)
  where state in ('review', 'learning');

-- ── Drill modes ────────────────────────────────────────────────────
create type drill_mode as enum ('audio', 'finish_it', 'type_out', 'ref_to_verse');

-- ── Review audit log ───────────────────────────────────────────────
create table if not exists reviews (
  id           bigserial    primary key,
  user_id      uuid         not null references auth.users(id) on delete cascade,
  verse_id     bigint       not null references verses(id),
  drill_mode   drill_mode   not null,
  grade        smallint     not null check (grade between 1 and 4),
  duration_ms  int,
  transcript   text,
  accuracy     real,
  created_at   timestamptz  not null default now()
);

create index if not exists reviews_user_created on reviews (user_id, created_at desc);

-- ── Sessions ───────────────────────────────────────────────────────
create table if not exists sessions (
  id             bigserial    primary key,
  user_id        uuid         not null references auth.users(id) on delete cascade,
  started_at     timestamptz  not null default now(),
  ended_at       timestamptz,
  total_reviews  int          not null default 0,
  accuracy       real
);

-- ── Streaks ────────────────────────────────────────────────────────
create table if not exists streaks (
  user_id      uuid    primary key references auth.users(id) on delete cascade,
  current_days int     not null default 0,
  best_days    int     not null default 0,
  last_day     date
);

-- ── Row-level security ─────────────────────────────────────────────
alter table user_verses enable row level security;
alter table reviews     enable row level security;
alter table sessions    enable row level security;
alter table streaks     enable row level security;

create policy "own data only" on user_verses  for all using (auth.uid() = user_id);
create policy "own data only" on reviews      for all using (auth.uid() = user_id);
create policy "own data only" on sessions     for all using (auth.uid() = user_id);
create policy "own data only" on streaks      for all using (auth.uid() = user_id);

-- verses are public read
alter table verses enable row level security;
create policy "anyone can read verses" on verses for select using (true);

-- ── Auto-create user_verses rows for every verse on first sign-in ──
create or replace function init_user_verses()
returns trigger language plpgsql security definer as $$
begin
  insert into user_verses (user_id, verse_id)
  select new.id, v.id from verses v
  on conflict do nothing;

  insert into streaks (user_id) values (new.id)
  on conflict do nothing;

  return new;
end;
$$;

create or replace trigger on_user_created
  after insert on auth.users
  for each row execute function init_user_verses();
