# Календар UA WELL

Telegram Mini App + bot announcement for the UA WELL Business Community
event calendar. Phase 1: real Telegram launch, real bot announcement, hosted
on GitHub Pages + Supabase Cloud free tier. No VPS, no Coolify.

Design: `docs/superpowers/specs/2026-05-19-phase-1-design.md`.

---

## Local dev

Prereqs on macOS:

- Node >= 20
- Docker Desktop running (for local Supabase)
- (Supabase CLI is invoked via `npx supabase`; no global install required.)

```bash
npm install
cp .env.example .env.local
npm run db:start           # boots Supabase via Docker (first run pulls images, ~3 min)
# Copy the printed anon key into .env.local as VITE_SUPABASE_ANON_KEY
npm run db:reset           # applies migrations 0001 + 0002 + new seed
npm run dev                # http://localhost:5173
```

Supabase Studio for poking at the DB: <http://127.0.0.1:54323>.

### Smoke test

1. Open <http://localhost:5173/> in the browser — list of 11 seeded UA WELL
   events with posters, sorted by date.
2. Switch persona to Олександр (адмін) → "+ Нова подія" appears.
3. Create an event. The Edge Function call will fail locally unless you
   serve `announce` with secrets (see below) — that's fine, the event still
   saves and you can re-publish later.
4. Switch to Марія → open any event → tap **Іду** → counter increments.
5. Switch to Павло → same → counter increments again.
6. Force a "full" event: open Studio, drop a capacity to 1, then try to
   RSVP from another persona → toast `Місць не залишилось`.

### Race test

```bash
npm test                   # runs the rsvp_going race (20 parallel → exactly 5)
```

Requires the local Supabase stack to be running and `.env.local` populated.

---

## Production setup (one-time)

### Supabase Cloud

```bash
# 1. Create a project at supabase.com (region eu-central-1).
# 2. Link this repo to it.
npx supabase link --project-ref <ref>
# 3. Push migrations.
npx supabase db push
# 4. Paste seed.sql into Studio SQL editor and run once.
# 5. Copy the project URL + anon key into GitHub repo secrets (see below).
```

### Edge Function `announce`

```bash
npx supabase functions deploy announce --no-verify-jwt
npx supabase secrets set \
  BOT_TOKEN=<from-BotFather> \
  BOT_USERNAME=<bot-username-without-@> \
  FORUM_CHAT_ID=<negative-chat-id> \
  PUBLIC_BASE_URL=https://<your-gh-username>.github.io/calendar-app-tg/
```

### BotFather

1. `/newbot` → save token.
2. `/newapp` → short name `calendar`, URL
   `https://<your-gh-username>.github.io/calendar-app-tg/`.
3. `/setdomain` → `<your-gh-username>.github.io`.
4. Add the bot to your community group as admin; fetch the negative chat ID
   (any "get chat id" bot, or read `getUpdates`).

### GitHub Pages

Repo → **Settings → Pages → Source = GitHub Actions**.

Add repo secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FUNCTIONS_URL` (e.g. `https://<ref>.supabase.co/functions/v1`)

Push to `main` — the workflow builds and publishes within ~2 min.
The Mini App lives at `https://<your-gh-username>.github.io/calendar-app-tg/`.

### Admin promotion

New tg users insert with `is_admin = false`. To promote yourself:

```sql
update users set is_admin = true where tg_id = <your-real-tg-id>;
```

---

## What's in this repo

- `src/` — Mini App (React 19 + Vite + Tailwind v4 + shadcn)
- `supabase/migrations/` — schema (0001 init, 0002 Phase 1: images, telegram bookkeeping, new enum)
- `supabase/seed.sql` — 11 UA WELL events with verbatim Ukrainian descriptions
- `supabase/functions/announce/` — Edge Function for bot announcements
- `public/events/` — event poster images
- `tests/rsvp_going.race.test.ts` — capacity race test
- `.github/workflows/deploy.yml` — GH Pages deploy
- `docs/superpowers/specs/` — design specs

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | tsc + Vite production build (base `/calendar-app-tg/`) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest including the race test |
| `npm run db:start` / `db:stop` / `db:reset` / `db:status` | Supabase local lifecycle |
| `npm run setup` | One-liner: start Supabase + reset DB |
