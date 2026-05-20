-- Phase 1: mock comment thread per event. Acts like a chat — anyone can read,
-- the demo client writes on behalf of the current persona. RLS stays off.

create table comments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id  uuid not null references users(id),
  body     text not null,
  created_at timestamptz not null default now()
);

create index on comments (event_id, created_at);
