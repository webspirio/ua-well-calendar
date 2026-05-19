# calendar-app-tg — local demo

Telegram bot + Mini App calendar for a ~100-person community.
This repo is currently in **local-demo-only** mode: a runnable React Mini App
on macOS that demos the event/RSVP flow at a meeting. No VPS, no real Telegram.

For the long-term roadmap see `PHASE_0_AND_1.md`.
For the design behind this demo see `docs/superpowers/specs/2026-05-19-local-demo-setup-design.md`.

---

## Quick start (fresh clone)

Prereqs on macOS:

- Node >= 20
- Docker Desktop running
- (Supabase CLI is invoked via `npx supabase`; no global install required.)

```bash
npm install
cp .env.example .env.local
npm run db:start         # boots Supabase via Docker (first run pulls images, ~3 min)
# Copy the printed anon key into .env.local as VITE_SUPABASE_ANON_KEY
npm run db:reset         # applies migrations + seed
npm run dev              # http://localhost:5173
```

Supabase Studio for poking at the DB: <http://127.0.0.1:54323>.

---

## Demo script

1. Open as Alex (admin) -> two seeded events.
2. Click **+ New event** -> fill the form -> submit -> it appears in the list.
3. Switch persona to Maria -> open an event -> tap **Going** -> capacity ticks up.
4. Switch to Pavlo -> same event -> **Going** -> ticks up again.
5. In Studio, drop capacity to 1 (`update events set capacity = 1 where ...`) -> a third RSVP shows `Event is full`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | tsc + Vite production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (no tests yet) |
| `npm run db:start` / `db:stop` / `db:reset` / `db:status` | Supabase local lifecycle (`npx supabase` under the hood) |
| `npm run setup` | One-liner: start Supabase + reset DB |

---

## What's in this repo

- `src/` — Mini App (React 19 + Vite + Tailwind v4 + shadcn)
- `supabase/` — local migration + seed
- `bot/` — parked grammY skeleton (standalone, does not run during the demo)
- `docs/superpowers/` — design specs and implementation plans
