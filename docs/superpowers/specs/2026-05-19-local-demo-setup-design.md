# Local Demo Setup — Design

**Date:** 2026-05-19
**Mode:** local-demo-only (no VPS, no Coolify, no real Telegram)
**Goal:** A runnable React Mini App on macOS that demos the event/RSVP flow at a meeting. End state: `npm run dev` → browser → log in as a mock persona → create an event → RSVP from a second persona.

---

## 1. Scope

### In scope
- Single-app repo (no monorepo), npm, React 19 + Vite + TypeScript + Tailwind v4 + shadcn — following travel-crm conventions where applicable.
- Local Supabase via the Supabase CLI (Docker), with migrations + seed.
- Three Mini App screens: event list, event detail (RSVP), admin create-event.
- Persona-picker mock auth (localStorage), RLS off.
- Parked grammY bot skeleton in `/bot` (does not run during the demo).
- Vitest scaffold (no tests written — Phase 1 real adds the one race test on `rsvp_going`).
- ESLint + TypeScript strict mode.

### Out of scope (deferred)
- Real Telegram `initData` → JWT handshake (Phase 1 real).
- RLS policies (Phase 1 real).
- Edge Functions (`tg-auth`, etc.).
- Recurring events, paid events, reminders, waitlist, calendar grid (Phase 2+).
- Hostinger VPS, Coolify, Cloudflare Tunnel, DNS, TLS.
- i18n, Zustand, Sentry, logger primitive, RTL/jsdom test harness — all overkill for the demo.

---

## 2. Repo layout

```
calendar-app-tg/
├── src/                          # Mini App (Vite + React 19 + TS)
│   ├── components/
│   │   ├── ui/                   # shadcn primitives (button, card, input, label, textarea, badge, select, sonner)
│   │   ├── PersonaPicker.tsx
│   │   └── AppHeader.tsx
│   ├── lib/
│   │   ├── supabase.ts           # client init
│   │   ├── persona.ts            # currentUserId(), setCurrentUserId(), PERSONAS
│   │   ├── queries.ts            # React Query query factories
│   │   └── utils.ts              # shadcn cn() helper
│   ├── pages/
│   │   ├── EventList.tsx         # /
│   │   ├── EventDetail.tsx       # /event/:id
│   │   └── AdminNew.tsx          # /admin/new
│   ├── router.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── env.d.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 0001_init.sql
│   └── seed.sql
├── bot/                          # parked grammY skeleton (doesn't run)
│   ├── src/index.ts
│   ├── package.json
│   └── tsconfig.json
├── scripts/                      # (empty for v0; placeholder for later)
├── public/
├── index.html
├── package.json                  # npm, single app at root
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                # @/ alias, port 5173
├── components.json               # shadcn config (style: base-nova, neutral, cssVariables)
├── eslint.config.js
├── vitest.config.ts              # scaffold; no tests in this phase
├── .env.local                    # VITE_SUPABASE_URL/KEY (gitignored)
├── .env.example
├── .gitignore
└── README.md
```

### Dependencies

**Runtime:**
`react@19`, `react-dom@19`, `react-router@7`, `@tanstack/react-query`, `@supabase/supabase-js`, `react-hook-form`, `@hookform/resolvers`, `zod`, `sonner`, `date-fns`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`.

**UI:**
`tailwindcss@4`, `@tailwindcss/vite`, shadcn (style: `base-nova`, neutral baseColor, cssVariables on, alias `@/components`).

**Dev:**
`vite@8`, `typescript`, `@vitejs/plugin-react`, `vitest`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@types/node`, `@types/react`, `@types/react-dom`, `tsx`.

### npm scripts (root)

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "db:start": "supabase start",
  "db:stop": "supabase stop",
  "db:reset": "supabase db reset",
  "db:status": "supabase status",
  "setup": "supabase start && supabase db reset"
}
```

The demo flow is: `npm run db:start` once, then `npm run dev` in another terminal. No `concurrently` glue — keeps it as simple as travel-crm's flow.

---

## 3. Supabase schema, seed, RPC

### Migration `supabase/migrations/0001_init.sql`

Exactly as written in `DEV_SETUP_LOCAL.md` §2:

- Extension: `pgcrypto`.
- Table `users(id uuid PK default gen_random_uuid(), tg_id bigint UNIQUE NOT NULL, username text, first_name text, is_admin boolean NOT NULL default false, created_at timestamptz NOT NULL default now())`.
- Enum `event_type` ∈ `'meetup' | 'workshop'`.
- Table `events(id, creator_id → users, title NOT NULL, description, location, starts_at NOT NULL, ends_at NOT NULL, type event_type NOT NULL default 'meetup', capacity int NOT NULL CHECK capacity > 0, created_at)`. Index on `starts_at`.
- Table `rsvps(event_id → events ON DELETE CASCADE, user_id → users, status text NOT NULL CHECK status ∈ ('going','cancelled'), created_at, PRIMARY KEY (event_id, user_id))`.
- **RLS is commented out** in this migration. The Phase-1-real migration uncomments these `alter table … enable row level security` lines plus the policies.
- Function `rsvp_going(p_event_id uuid, p_user_id uuid) RETURNS rsvps LANGUAGE plpgsql`:
  1. `SELECT capacity INTO v_capacity FROM events WHERE id = p_event_id FOR UPDATE;` — locks the event row to serialize concurrent RSVPs.
  2. If `v_capacity IS NULL`, raise `event not found`.
  3. If a 'going' row already exists for `(p_event_id, p_user_id)`, return it (idempotent).
  4. Count current 'going' rows; if `>= v_capacity`, raise `event full`.
  5. Insert or upsert a 'going' row, return it.

The `p_user_id` parameter exists because we have no `auth.uid()` in demo mode. Phase 1 real drops `p_user_id` from the signature and reads `auth.uid()` instead — the body shape is otherwise identical.

### Seed `supabase/seed.sql`

```sql
insert into users (id, tg_id, username, first_name, is_admin) values
  ('00000000-0000-0000-0000-000000000001', 111, 'alex_admin',   'Alex',  true),
  ('00000000-0000-0000-0000-000000000002', 222, 'maria_member', 'Maria', false),
  ('00000000-0000-0000-0000-000000000003', 333, 'pavlo_member', 'Pavlo', false);

insert into events (creator_id, title, description, location, starts_at, ends_at, type, capacity) values
  ('00000000-0000-0000-0000-000000000001',
   'Friday coffee chat', 'Casual catch-up at the usual spot.', 'Central café',
   now() + interval '3 days', now() + interval '3 days 2 hours', 'meetup', 8),
  ('00000000-0000-0000-0000-000000000001',
   'React + Supabase workshop', 'Hands-on: build a small CRUD.', 'Coworking, Room B',
   now() + interval '10 days', now() + interval '10 days 3 hours', 'workshop', 12);
```

Using `now() + interval` is deliberate — events stay "upcoming" relative to whatever day you reset the DB. No need to keep editing seed dates before each demo.

---

## 4. Mini App — auth shim, routes, screens

### Boot sequence

```
main.tsx → ReactDOM.createRoot(<App />)
App.tsx → <QueryClientProvider> + <RouterProvider> + <Toaster />
router.tsx → routes wrapped in <AppLayout> (header + <Outlet />)
```

`QueryClient` is constructed once at module level with `defaultOptions.queries.staleTime: 30_000` (avoids hammering local PG during demo navigation).

### `<AppLayout>` and `<AppHeader>`

- Top bar: app title on the left, `<PersonaPicker>` on the right.
- `<PersonaPicker>` is a shadcn `<Select>` listing the three personas by label (`"Alex (admin)"`, `"Maria"`, `"Pavlo"`). Changing the selection writes `localStorage['demo.user_id']` and calls `location.reload()` — the whole app remounts as that user. Brutally simple, but it matches the meeting story (one tab, one identity at a time).
- An admin badge renders next to the title when `useMe()` resolves to a row with `is_admin = true`.

### `lib/persona.ts`

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

### `lib/queries.ts` — query keys

| Key | What it fetches |
|---|---|
| `['me', userId]` | `select * from users where id = userId` |
| `['events']` | `select * from events where starts_at >= now() order by starts_at` |
| `['event', id]` | `select * from events where id = id` |
| `['rsvps', eventId]` | `select user_id, status from rsvps where event_id = eventId` (used for going-count + "is current persona going") |

All query factories return `{ queryKey, queryFn }` objects so they can be inlined into `useQuery(eventsQuery())`.

### Routes

| Path | Component | Behavior |
|---|---|---|
| `/` | `EventList` | List of `<EventCard>` showing title, datetime (`date-fns format`), location, "X / capacity going" badge. Tap → `/event/:id`. "+ New event" button at top-right, visible only when `me.is_admin`. |
| `/event/:id` | `EventDetail` | Header (title, type pill, datetime, location, description). Capacity bar. "Going" button → `useMutation` calling `supabase.rpc('rsvp_going', { p_event_id: id, p_user_id: currentUserId() })`. On error message `event full`, `toast.error("Event is full")`; on other errors, `toast.error(err.message)`. On success, invalidate `['rsvps', id]`. Secondary "Cancel RSVP" button → `update rsvps set status='cancelled' where event_id = id and user_id = currentUserId()`. |
| `/admin/new` | `AdminNew` | Client-side gate: if `!me.is_admin`, `Navigate to="/"`. Form fields: title (3–80 chars), description (≤2000), location (≤200), starts_at (datetime-local), ends_at (datetime-local), capacity (int 1–500), type ('meetup' \| 'workshop'). Zod schema with `.refine(d => new Date(d.ends_at) > new Date(d.starts_at))`. Submit → `supabase.from('events').insert({…, creator_id: currentUserId()}).select().single()`, toast success, navigate to `/event/<new-id>`. |

### Persona / admin gating

Client-only — there is no untrusted client in this demo. When real auth lands, RLS does the enforcement; the gates here are pure UX.

---

## 5. Bot skeleton (parked)

### `bot/src/index.ts`

```ts
import { Bot } from 'grammy';

const bot = new Bot(process.env.BOT_TOKEN ?? 'dummy');
bot.command('start', (ctx) =>
  ctx.reply('Calendar bot. Open the Mini App from the menu.'),
);
console.log('Bot skeleton — not started in demo mode.');
```

### `bot/package.json` (standalone — not a workspace member)

```json
{
  "name": "bot",
  "private": true,
  "type": "module",
  "scripts": { "dev": "tsx watch src/index.ts" },
  "dependencies": { "grammy": "^1.30.0" },
  "devDependencies": { "tsx": "^4.20.0", "typescript": "^5.7.0" }
}
```

The root `package.json` does **not** reference the bot. Its dependencies are not installed by the root `npm install`. If someone runs `cd bot && npm install && npm run dev`, it prints one line and exits — which is the entire point.

---

## 6. Dev runbook + demo script

### First-time setup (project bootstrap — run once during implementation)

```bash
cd /Users/oleksandrsecond/Projects/calendar-app-tg
git init
npm install
supabase init       # creates supabase/config.toml (commit after)
# … place 0001_init.sql + seed.sql under supabase/ …
supabase start      # boots Docker stack — first time downloads images, ~3 min
# Copy the printed anon key into .env.local as VITE_SUPABASE_ANON_KEY
supabase db reset   # applies migrations + seed
```

For a fresh clone after the project is committed, the contributor skips `git init` and `supabase init` — both have already been done. They run `npm install`, `cp .env.example .env.local` (then paste the anon key from `supabase start` output), `supabase start`, `supabase db reset`.

### `.env.example`

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=
```

### Daily dev loop

```bash
npm run db:start    # if not already running
npm run dev         # opens http://localhost:5173
```

Supabase Studio at `http://127.0.0.1:54323` for poking at the DB.

### Demo script (the meeting)

1. Open the list as Alex (admin) → two seeded events.
2. Click **+ New event** → fill the form → submit → it appears in the list.
3. Switch persona to Maria → open the new event → tap **Going** → capacity counter ticks up.
4. Switch to Pavlo → same event → **Going** → counter ticks up again.
5. Lower capacity to 1 in Studio (or seed with capacity 1) → second RSVP gets `Event is full`.
6. Talk about what's next: Telegram auth, deployment, recurrence, paid events. Point at `bot/` and `PHASE_0_AND_1.md` as the next-phase roadmap.

### Acceptance criteria (demo done = these all hold)

- `npm run dev` opens the Mini App at `http://localhost:5173`.
- Persona picker switches identity; admin badge appears for Alex only.
- "+ New event" only visible to Alex.
- Creating an event puts a row in `public.events` and shows it in the list immediately.
- Tapping Going writes a `rsvps` row; the going count updates without a manual refresh.
- Hitting capacity raises `event full`; the UI shows `toast.error("Event is full")`.
- `npm run lint` passes.
- `npm run build` succeeds.

### Things to NOT do (carry-over from `DEV_SETUP_LOCAL.md`)

- Don't wire up real Telegram auth. The persona picker is the honest dev shortcut.
- Don't enable RLS. With mock auth there's no `auth.uid()` — turning it on creates confusing 403s.
- Don't push to a VPS or Vercel "just in case". Time sink, zero meeting value.
- Don't write tests. The race test on `rsvp_going` ships with Phase 1 real, not this demo.

---

## 7. What this design is NOT

- It is not the Phase-0/1 production setup. That doc (`PHASE_0_AND_1.md`) remains the long-term target. This design is one of two artifacts that get superseded the moment Phase 1 real begins; the other is the persona-picker code. Tables, columns, RPC body, screen layouts, and React patterns all survive that transition unchanged.
- It is not a Vercel-deployable build. There is no public URL, no `tg-auth` Edge Function, no Telegram. The bot folder is a placeholder.
- It is not a multi-tenant template. Single community, hardcoded personas.
