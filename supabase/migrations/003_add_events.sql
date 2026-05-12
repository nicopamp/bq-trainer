-- Competition Season: events table for user-managed milestones
create table events (
  id          bigserial primary key,
  user_id     uuid references auth.users not null,
  name        text not null,
  date        date not null,
  end_chapter int  not null,
  created_at  timestamptz default now()
);

alter table events enable row level security;

create policy "users manage own events"
  on events for all using (auth.uid() = user_id);

create index events_user_date on events (user_id, date);
