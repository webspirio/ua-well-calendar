insert into users (id, tg_id, username, first_name, is_admin) values
  ('00000000-0000-0000-0000-000000000001', 111, 'alex_admin',   'Alex',  true),
  ('00000000-0000-0000-0000-000000000002', 222, 'maria_member', 'Maria', false),
  ('00000000-0000-0000-0000-000000000003', 333, 'pavlo_member', 'Pavlo', false);

insert into events (creator_id, title, description, location, starts_at, ends_at, type, capacity) values
  ('00000000-0000-0000-0000-000000000001',
   'Friday coffee chat',
   'Casual catch-up at the usual spot.',
   'Central café',
   now() + interval '3 days',
   now() + interval '3 days 2 hours',
   'meetup', 8),
  ('00000000-0000-0000-0000-000000000001',
   'React + Supabase workshop',
   'Hands-on: build a small CRUD.',
   'Coworking, Room B',
   now() + interval '10 days',
   now() + interval '10 days 3 hours',
   'workshop', 12);
