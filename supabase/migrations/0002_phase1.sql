-- Phase 1: add Telegram bookkeeping columns, per-event poster, and switch
-- event_type from the placeholder ('meetup','workshop') to the community's
-- color taxonomy ('offline','online','trip').

alter table events
  add column tg_message_id bigint,
  add column tg_chat_id    bigint;

alter table events add column image_url text;

-- Postgres can't rename or reorder enum values cleanly, and the seed table
-- is the only data we ever have in this DB. Drop the type with cascade
-- (drops events.type), recreate, re-add the column. seed.sql is rewritten
-- to populate with the new enum values.
drop type if exists event_type cascade;
create type event_type as enum ('offline', 'online', 'trip');
alter table events add column type event_type not null default 'offline';
