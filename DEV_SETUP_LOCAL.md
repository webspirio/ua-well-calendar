# Local Dev Setup — Demo Mode

> **Goal**: a runnable prototype on your Mac to show at a meeting. No VPS,
> no public URL, no real Telegram integration. Mini App opens in a browser
> with a mock Telegram user; Supabase runs locally in Docker; data persists
> between restarts. Bot code lives in the repo but doesn't need to run.

**Effort: 4–6 hours.** End state: `pnpm dev` → browser opens → you log in
as a mock admin → create an event → see it in a list → RSVP from a second
mock user. That's the demo.

---

## What we're cutting from the bigger plan

| Skipped | Why |
|---|---|
| Hostinger VPS, Coolify install, DNS, TLS | Not needed for local demo |
| BotFather setup | Mock initData lets the Mini App boot without a real bot |
| Cloudflare Tunnel | No public URL needed |
| Webhook registration, set-webhook script | Bot doesn't receive updates in demo |
| Supabase Cloud project | Local `supabase start` is faster and offline |
| Custom JWT minting via Edge Function | Use a **dev shortcut**: stub the auth handshake locally (see §5) |

What we **keep**: monorepo skeleton, schema + RLS + `rsvp_going()` RPC,
React + shadcn Mini App, mock auth, seed data with 3 personas.

---

## 0 — Prerequisites (15 min)

Already on your Mac (confirmed): Node 25, Docker 29.

Install the rest:

```bash
npm i -g pnpm@9
brew install supabase/tap/supabase
```

Verify:
```bash
pnpm --version && supabase --version && docker info > /dev/null && echo ok
```

---

## 1 — Repo skeleton (45 min)

```bash
cd /Users/oleksandrsecond/Projects/calendar-app-tg
git init
pnpm init
```

Create the layout:

```
calendar-app-tg/
├── apps/
│   ├── bot/                     # grammY skeleton — won't run in demo
│   └── web/                     # Vite + React + shadcn Mini App
├── supabase/
│   ├── config.toml
│   ├── migrations/0001_init.sql
│   └── seed.sql
├── package.json                 # root, pnpm workspaces
├── pnpm-workspace.yaml
├── .env.local                   # not committed
├── .gitignore
└── README.md
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
```

Root `package.json` scripts:
```json
{
  "name": "calendar-app-tg",
  "private": true,
  "scripts": {
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "web": "pnpm --filter web dev",
    "dev": "concurrently -k -n db,web \"pnpm db:start\" \"pnpm web\""
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

```bash
pnpm install
```

`.gitignore` (top level):
```
node_modules
dist
.env.local
.env.*.local
supabase/.branches
supabase/.temp
```

---

## 2 — Supabase local (30 min)

```bash
supabase init                  # creates supabase/config.toml
supabase start                 # boots Docker stack — first time downloads images, ~3 min
```

When it finishes, it prints:
```
API URL:   http://127.0.0.1:54321
DB URL:    postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio:    http://127.0.0.1:54323
anon key:  eyJ...
```

Save the **API URL** and **anon key** — those go in `apps/web/.env.local`.

Create `supabase/migrations/0001_init.sql`:

```sql
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
-- We'll switch on RLS + JWT in the real Phase 1.
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
```

`supabase/seed.sql`:

```sql
insert into users (id, tg_id, username, first_name, is_admin) values
  ('00000000-0000-0000-0000-000000000001', 111, 'alex_admin',    'Alex',    true),
  ('00000000-0000-0000-0000-000000000002', 222, 'maria_member',  'Maria',   false),
  ('00000000-0000-0000-0000-000000000003', 333, 'pavlo_member',  'Pavlo',   false);

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
   'Hands-on: build a small CRUD with RLS.',
   'Coworking, Room B',
   now() + interval '10 days',
   now() + interval '10 days 3 hours',
   'workshop', 12);
```

Apply:
```bash
supabase db reset    # drops, re-runs migrations, applies seed
```

Open Studio at `http://127.0.0.1:54323` → verify 3 users + 2 events.

---

## 3 — Mini App scaffold (1 h)

Inside `apps/web`:

```bash
cd apps/web
pnpm create vite@latest . --template react-ts
pnpm install
pnpm add @supabase/supabase-js zod react-router-dom date-fns
pnpm add -D @types/node tailwindcss postcss autoprefixer
npx tailwindcss init -p
pnpm dlx shadcn@latest init    # accept defaults
pnpm dlx shadcn@latest add button card input label textarea badge sonner
```

`apps/web/.env.local`:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste anon key from `supabase start` output>
```

`apps/web/src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

---

## 4 — Mock auth (no Telegram needed) (30 min)

The cleanest dev shortcut for the demo: a **persona picker** in the corner
of the screen. Click the persona, the whole app re-renders as that user.
No JWTs, no initData, no Telegram. Just a `currentUserId` in localStorage.

`apps/web/src/lib/persona.ts`:
```ts
const KEY = 'demo.user_id';

export const PERSONAS = [
  { id: '00000000-0000-0000-0000-000000000001', label: 'Alex (admin)',   isAdmin: true  },
  { id: '00000000-0000-0000-0000-000000000002', label: 'Maria',          isAdmin: false },
  { id: '00000000-0000-0000-0000-000000000003', label: 'Pavlo',          isAdmin: false },
] as const;

export function currentUserId(): string {
  return localStorage.getItem(KEY) ?? PERSONAS[0].id;
}
export function setCurrentUserId(id: string) {
  localStorage.setItem(KEY, id);
  location.reload();
}
```

Drop a `<PersonaPicker />` in the app header. Everywhere you'd use
`auth.uid()`, pass `currentUserId()` as `p_user_id` to the RPC instead.

> **What to say in the meeting** when this comes up:
> *"In production this is replaced by a Supabase Edge Function that validates
> Telegram `initData` and mints a Supabase JWT. The rest of the app is
> identical — RLS policies just key off `auth.uid()` instead of a passed-in
> ID."*

---

## 5 — Screens (1.5–2 h)

Three routes, all in `apps/web/src/`:

- `/` — **Event list.** `select * from events order by starts_at`. Show
  title, datetime, capacity-going badge. Tap → detail.
- `/event/:id` — **Event detail.** Header + "Going (n/capacity)" + a
  big Going / Cancel button. On Going: `supabase.rpc('rsvp_going', {
  p_event_id, p_user_id: currentUserId() })`. Show toast on `event full`.
- `/admin/new` — **Create event.** Only renders when persona is admin.
  shadcn form + zod, insert into `events`, redirect to detail.

You don't need router-based code-splitting or anything fancy. One file per
route. Use `sonner` toasts for feedback.

---

## 6 — Bot skeleton, parked (15 min)

Just to have something to show in the repo when someone asks "what about
the bot?". It won't run during the demo.

`apps/bot/package.json`:
```json
{
  "name": "bot",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "grammy": "^1.30.0",
    "hono": "^4.6.0"
  },
  "devDependencies": {
    "tsx": "^4.20.0",
    "typescript": "^5.7.0"
  }
}
```

`apps/bot/src/index.ts`:
```ts
import { Bot } from 'grammy';

// Skeleton — not wired up for the demo.
// In Phase 1, this becomes the announcement worker that posts events
// into the community's forum topics.
const bot = new Bot(process.env.BOT_TOKEN ?? 'dummy');
bot.command('start', (ctx) =>
  ctx.reply('Calendar bot. Open the Mini App from the menu.'),
);
console.log('Bot skeleton — not started in demo mode.');
```

---

## 7 — Demo runbook (5 min)

```bash
cd /Users/oleksandrsecond/Projects/calendar-app-tg
pnpm dev
```

That boots Supabase (if not running) and Vite together. Open
`http://localhost:5173`.

**In the meeting**, walk through:

1. Open the list as Alex (admin) → 2 seeded events.
2. Click "+ New event" → fill form → submit → it appears in the list.
3. Switch persona to Maria → open the new event → tap **Going** →
   capacity counter ticks up.
4. Switch to Pavlo → same event → **Going** → counter ticks up again.
5. Set the event to capacity 1 in Studio (or seed with capacity 1) and
   try the over-capacity case → toast "event full".

Then talk about what's next: Telegram integration, deployment to Coolify,
recurrence, paid events. The `PHASE_0_AND_1.md` doc is the roadmap.

---

## Time budget

| Step | Time |
|---|---|
| 0 — prereqs | 15 min |
| 1 — repo skeleton | 45 min |
| 2 — Supabase + schema + seed | 30 min |
| 3 — Mini App scaffold + shadcn | 60 min |
| 4 — mock auth (persona picker) | 30 min |
| 5 — three screens | 90–120 min |
| 6 — bot skeleton | 15 min |
| 7 — rehearse the demo | 30 min |
| **Total** | **4.5–5.5 h** |

Half a day of focused work. If anything goes sideways, the prereqs and
Supabase boot are the most likely culprits — fix those first before
touching the app code.

---

## Things to NOT do for the demo

- Don't wire up real Telegram auth. The persona picker is enough and
  is honest about being a dev shortcut.
- Don't enable RLS yet. With mock auth there's no `auth.uid()` to gate
  on. Turning it on now just creates confusing 403s during the demo.
- Don't try to push to a VPS "just in case." Time sink, zero meeting value.
- Don't deploy to Vercel either. Local on your laptop is fine — most
  meetings have screen-share.
- Don't add tests. Phase 1 (real) gets the one critical race-test on
  `rsvp_going`; the demo doesn't need it.
