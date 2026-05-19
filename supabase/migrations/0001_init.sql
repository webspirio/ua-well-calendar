create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  tg_id bigint unique not null,
  username text,
  first_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create type event_type as enum ('meetup', 'workshop');

create table events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references users(id),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type event_type not null default 'meetup',
  capacity int not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create index on events (starts_at);

create table rsvps (
  event_id uuid references events(id) on delete cascade,
  user_id  uuid references users(id),
  status   text not null check (status in ('going', 'cancelled')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Demo mode: RLS OFF so the mock anon key can read/write.
-- Phase 1 real flips these on and adds policies.
-- alter table users   enable row level security;
-- alter table events  enable row level security;
-- alter table rsvps   enable row level security;

create or replace function rsvp_going(p_event_id uuid, p_user_id uuid)
returns rsvps language plpgsql as $$
declare
  v_capacity int;
  v_count    int;
  v_row      rsvps;
begin
  select capacity into v_capacity
    from events where id = p_event_id for update;
  if v_capacity is null then raise exception 'event not found'; end if;

  if exists (select 1 from rsvps
             where event_id = p_event_id and user_id = p_user_id
               and status = 'going') then
    select * into v_row from rsvps
      where event_id = p_event_id and user_id = p_user_id;
    return v_row;
  end if;

  select count(*) into v_count
    from rsvps where event_id = p_event_id and status = 'going';
  if v_count >= v_capacity then raise exception 'event full'; end if;

  insert into rsvps (event_id, user_id, status)
    values (p_event_id, p_user_id, 'going')
    on conflict (event_id, user_id)
    do update set status = 'going', created_at = now()
    returning * into v_row;
  return v_row;
end $$;
