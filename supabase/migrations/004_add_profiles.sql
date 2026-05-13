create table profiles (
  id            bigserial primary key,
  user_id       uuid references auth.users not null unique,
  full_name     text not null,
  quiz_category text not null check (quiz_category in ('TBQ', 'EABQ')),
  church        text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table profiles enable row level security;

create policy "users manage own profile"
  on profiles for all using (auth.uid() = user_id);
