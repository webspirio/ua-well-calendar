-- Quick wins bundle: attendance tracking + speaker assignment.
-- Both columns are nullable and purely additive.

alter table rsvps
  add column attended boolean;

alter table events
  add column speaker_user_id uuid references users(id);
