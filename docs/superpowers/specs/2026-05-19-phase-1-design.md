# Phase 1 — Design

**Date:** 2026-05-19
**Supersedes (in part):** `2026-05-19-local-demo-setup-design.md` (the persona-picker-only demo)
**Status:** Approved by user 2026-05-19, ready for implementation plan

---

## 1. Goal + scope

Take the existing local demo and turn it into a real, runnable Telegram Mini App that an admin can open from a Telegram group, create an event in, and have the bot announce that event into the group with a tap-to-open deep link — while staying $0/mo and requiring zero VPS.

### In scope

- All UI text and seed data in **Ukrainian**.
- Two launch modes:
  - **Telegram launch.** Real user identified by `Telegram.WebApp.initDataUnsafe.user.id`. No `tg-auth` Edge Function, no JWT, no RLS.
  - **Browser dev launch.** Persona picker (existing) stays as the fallback — useful when showing the calendar on a laptop without Telegram.
- One-off events only (no recurrence). Free events only (no payments).
- **Event posters**: each seeded event has a branded UA WELL poster image (already provided in `public/events/`). Cards display the poster as the dominant visual; the Telegram announcement is sent as a photo with the poster.
- Bot announcement: when admin creates an event, a real Telegram message (photo + minimal caption + deep-link button) lands in a single configured chat (`FORUM_CHAT_ID`).
- Deep-link round-trip: tap the button in Telegram → Mini App opens → routes to `/event/:id`.
- Admin can delete an event (new — needed so demo-day mistakes don't require Studio).
- Race test on `rsvp_going` (20 parallel RSVPs against capacity = 5 → exactly 5 going).
- Hosted on **GitHub Pages**, DB and Edge Functions on **Supabase Cloud free tier**.

### Out of scope (deferred to v1.1+)

- `tg-auth` Edge Function, JWT, RLS — A1 decision.
- Forum-mode supergroup with per-type topic routing — T1 decision; topic mapping is a one-line env-var change later.
- Recurring events, paid events, waitlist, reminders, calendar grid, edit-event form, tags.
- Webhook-based long-running bot. The bot exists as a BotFather identity + an on-demand Edge Function. No process to keep alive.
- `unannounce` (bot deletes its own message when the event is deleted). Orphaned Telegram messages are acceptable for the presentation.
- **Image uploads for admin-created events** (P1 decision). Admin-created events have `image_url = null`; the card falls back to a placeholder gradient + type emoji, and the Telegram post is text-only. Supabase Storage upload UI is a v1.1 add.

### Trust model — called out explicitly

Anyone who learns the Supabase URL + anon key can read or modify any row. Acceptable for a private community demo with no public marketing of the URL. The honest fix is A2 (JWT + RLS) and is the headline of v1.1.

---

## 2. Architecture

Three components, in increasing order of "new work":

```
┌─────────────────────────────┐
│  Telegram (BotFather bot +  │
│  community group)           │
└─────────┬─────────────┬─────┘
          │             │
          │ sendMessage │ user opens Mini App
          │             │  (initData + start_param)
          │             ▼
          │  ┌─────────────────────────────┐
          │  │  Mini App (Vite SPA)        │
          │  │  React 19 + shadcn          │
          │  │  Hosted: GitHub Pages       │
          │  │  HashRouter                 │
          │  └─────┬───────────────────┬───┘
          │        │                   │
          │   anon key                 │ POST /announce
          │   read/write               │ (event_id, admin_user_id)
          │        ▼                   ▼
          │  ┌─────────────────┐  ┌──────────────────────┐
          │  │  Supabase Cloud │  │  Supabase Edge Fn:   │
          └──┤  (Postgres,     │  │  announce            │
             │  free tier)     │  │  uses BOT_TOKEN ➜    │
             │                 │  │  Telegram sendMessage │
             └─────────────────┘  └──────────────────────┘
```

### Why HashRouter, not BrowserRouter

GitHub Pages serves a single `index.html` and returns 404 for any other path. With BrowserRouter, `https://<you>.github.io/calendar-app-tg/event/abc` hard-refreshes into a 404. HashRouter renders the same route as `https://<you>.github.io/calendar-app-tg/#/event/abc`, which is one fixed file — works on Pages with zero config. Telegram doesn't care which router we use; the bot deep link sets `start_param`, not the URL path. The app reads `start_param` and `navigate("/event/<id>")` programmatically.

### Why the Edge Function for announcements (and not the client)

The bot token must not ship in the Vite bundle (anyone could send messages as the bot). The Edge Function holds `BOT_TOKEN` as a Supabase secret, accepts `{ event_id, admin_user_id }` from the client, looks up the event server-side, calls Telegram's `sendMessage`, and writes `tg_message_id` back. ~50 lines of Deno. No webhook, no long-running process.

### Why no JWT (A1 decision)

The function trusts the `admin_user_id` it's given (verifies the row has `is_admin = true`, but doesn't verify the *caller* is that admin). Worst case in a private demo: a curious attendee could call `announce` to repost an event. Acceptable for one meeting.

---

## 3. Data + schema changes

### New migration `supabase/migrations/0002_phase1.sql`

```sql
-- Track where the bot posted the announcement (so we can edit/delete it later).
alter table events
  add column tg_message_id bigint,
  add column tg_chat_id    bigint;

-- Per-event poster image. Stored as a path relative to the deployed app
-- (e.g. 'events/04.05.jpg'). Client prepends import.meta.env.BASE_URL;
-- Edge Function prepends PUBLIC_BASE_URL secret when constructing the
-- absolute URL for Telegram sendPhoto.
alter table events add column image_url text;

-- Phase 1 uses three event categories matching the community's color taxonomy.
-- Drop and recreate the enum because Postgres can't rename enum values cleanly
-- and the seed table is small enough to repopulate.
drop type if exists event_type cascade;
create type event_type as enum ('offline', 'online', 'trip');

-- Re-add the column with the new enum.
alter table events add column type event_type not null default 'offline';
```

> Note: this drops the existing `events.type` column. Since seed data is the only data in any environment, that's safe. The dev rebuild flow is `npm run db:reset`, which re-runs both migrations + seed.

### Updated seed `supabase/seed.sql`

The existing seed file is **rewritten wholesale** as part of Phase 1 — the two old placeholder events ("Friday coffee chat" / "React + Supabase workshop") are dropped, and the eleven Ukrainian events listed below replace them. On `npm run db:reset` (local) and on the manual Studio-paste step (cloud), the new seed becomes the only data in the DB.

Three personas keep the same UUIDs (so existing `localStorage["demo.user_id"]` keeps working). Renamed to:

- `00000000-0000-0000-0000-000000000001` — `Олександр (адмін)`, `is_admin = true`
- `00000000-0000-0000-0000-000000000002` — `Марія`
- `00000000-0000-0000-0000-000000000003` — `Павло`

Eleven seeded events (verbatim from the user's May 2026 community calendar post, verbatim Ukrainian descriptions). Image files already live in `public/events/` — filename convention is `DD.MM.jpg`, with the multi-day yacht trip as the single exception (`sailing.jpg`):

| # | Date | Time | Type | Location | Title | Capacity | Image |
|---|---|---|---|---|---|---|---|
| 1 | 02.05 → 09.05 | 12:00–18:00 | trip (🔵) | Греція | Яхтинг Греція | 8 | `events/sailing.jpg` |
| 2 | 04.05 (пн) | 17:00 | offline (🟠) | Фрайбург | Networking та Mastermind | 12 | `events/04.05.jpg` |
| 3 | 06.05 (ср) | 18:00 | online (🟢) | Online | Vielleicht Vielleicht: продаємо собі Німеччину | 100 | `events/06.05.jpg` |
| 4 | 07.05 (чт) | 17:00 | offline (🟠) | Штутгарт | Workshop — «Стратегії в бізнесі» | 20 | `events/07.05.jpg` |
| 5 | 09.05 (сб) | 13:00 | offline (🟠) | м. Ульм | Трансформаційна гра «Успішні рішення» | 10 | `events/09.05.jpg` |
| 6 | 11.05 (пн) | 18:00 | online (🟢) | Online | Аналіз ніші та конкурентів | 100 | `events/11.05.jpg` |
| 7 | 13.05 (ср) | 17:00 | offline (🟠) | Нюрнберг | Networking та Mastermind | 12 | `events/13.05.jpg` |
| 8 | 15.05 (пт) | 17:00 | offline (🟠) | Фрідріхсхафен | Mastermind | 12 | `events/15.05.jpg` |
| 9 | 16.05 (сб) | 10:00 | offline (🟠) | Ендерсбах → Шондорф | Велотур | 15 | `events/16.05.jpg` |
| 10 | 18.05 (пн) | 17:00 | offline (🟠) | Мюнхен | Networking та Mastermind | 12 | `events/18.05.jpg` |
| 11 | 20.05 (ср) | 18:00 | online (🟢) | Online | Розбір бізнес-кейсів: AI та автоматизація | 100 | `events/20.05.jpg` |

Inferred values flagged for the user (confirmed):
- "2.02-9.05" Яхтинг read as **2.05–9.05** (typo in the source post).
- Велотур had no time listed; **10:00** (~3–4 h ride).
- Capacities educated guesses based on event type.
- The original `19.05.jpg` file was renamed to `11.05.jpg` to match the convention (the image itself depicts the 11.05 event).

### Card layout with poster

The existing card layout (title + meta in a small Card) changes to a poster-first layout: the image fills the top of the card (portrait aspect preserved, `object-cover`, max-height bounded), with title/date/location/capacity stacked below. Past events (`starts_at < now()`) get a `grayscale` filter on the image plus a "Минула подія" badge. Cards with `image_url = null` (future admin-created events) fall back to a gradient background tinted by event type plus the type emoji.

### Data flow

| Operation | Path |
|---|---|
| Load event list | Client → Supabase (`events` ORDER BY `starts_at` ASC — **no upcoming-only filter**, past events stay visible with a "Минула подія" label) |
| RSVP "Іду" | Client → `supabase.rpc('rsvp_going', { p_event_id, p_user_id })` — unchanged from current demo |
| Cancel RSVP | Client → `update rsvps set status='cancelled' where event_id=? and user_id=?` |
| Admin creates event | Client → `insert into events` → on success → `fetch(<EDGE_URL>/announce, { event_id, admin_user_id })` → Edge Fn does `sendMessage` + `update events set tg_message_id, tg_chat_id` |
| Admin deletes event | Client → `delete from events where id=?` (rsvps cascade). The Telegram message is *not* deleted (deferred to v1.1). |

The events query drops `.gte("starts_at", new Date().toISOString())` and sorts ascending. Heading copy changes from "Найближчі події" to **"Календар подій"**.

---

## 4. UI text + Ukrainian strings

### Approach: one central strings file, no i18n library

Single-language project. `react-i18next` would be overhead with no payoff. We add `src/lib/strings.ts` — a flat const object with every user-facing label in one place. Components import named keys. If EN is added later, swap to a real i18n lib is ~1 hour because all strings are already centralized.

```ts
// src/lib/strings.ts (excerpt — final list in implementation plan)
export const t = {
  app: {
    title: "Календар UA WELL",
    adminBadge: "Адмін",
  },
  list: {
    heading: "Календар подій",
    empty: "Подій ще немає.",
    newEvent: "+ Нова подія",
    pastLabel: "Минула подія",
    goingCount: (going: number, capacity: number) => `${going} / ${capacity} йдуть`,
  },
  detail: {
    backToList: "До списку",
    going: "Іду",
    cancelRsvp: "Скасувати",
    delete: "Видалити подію",
    deleteConfirm: "Видалити подію? Цю дію не можна скасувати.",
    notFound: "Подію не знайдено.",
    republish: "Опублікувати в Telegram",
  },
  admin: {
    title: "Нова подія",
    submit: "Створити подію",
    submitting: "Створення…",
    fields: {
      title: "Назва", description: "Опис", location: "Місце",
      startsAt: "Початок", endsAt: "Кінець",
      capacity: "Кількість місць", type: "Тип",
    },
    types: { offline: "🟠 Офлайн", online: "🟢 Онлайн", trip: "🔵 Подорож" },
  },
  toast: {
    eventFull: "Місць не залишилось",
    eventCreated: "Подію створено",
    eventDeleted: "Подію видалено",
    announceFailed: "Подію створено, але оголошення не надіслано",
    rsvpCancelled: "Реєстрацію скасовано",
  },
  common: { loading: "Завантаження…", error: "Сталася помилка" },
} as const
```

### Date formatting

All `date-fns` calls switch to `uk` locale:

```ts
import { uk } from "date-fns/locale"
format(new Date(starts_at), "d MMM (EEEEEE), HH:mm", { locale: uk })
// → "20 трав (ср), 18:00"
```

Multi-day events render via a small helper: `formatRange(startsAt, endsAt)` → `"02 – 09 трав"`.

### Bot announcement template

Lives in the `announce` Edge Function (not in `strings.ts`). Two code paths depending on whether the event has a poster:

**With poster (`image_url != null`)** — `sendPhoto` with minimal caption. The poster already contains date/time/location/online tag baked in, so the caption stays short:

```
*{title}*

Реєстрація: до {capacity} учасників
```

`photo` parameter: `${PUBLIC_BASE_URL}${image_url}` — an absolute URL Telegram fetches and re-hosts internally.

**Without poster (`image_url == null`)** — `sendMessage` with full text fallback:

```
{colorEmoji} {dd.MM (день)} {HH:mm} {location}

*{title}*

{description}

Реєстрація: до {capacity} учасників
```

In both cases, an `inline_keyboard` with a single `url` button:

```json
{
  "text": "👉 Відкрити в застосунку",
  "url": "https://t.me/<BOT_USERNAME>/calendar?startapp=event_<id>"
}
```

A `web_app` button doesn't work in groups — only `url` buttons pointing to a `t.me/<bot>/<app>` deep link do. Telegram unwraps the `startapp` param into `start_param` when the user opens the Mini App.

`colorEmoji` is derived from `event.type` (`offline` → 🟠, `online` → 🟢, `trip` → 🔵). Day-of-week abbreviation comes from `date-fns` `uk` locale. `PUBLIC_BASE_URL` is a new Supabase secret, e.g. `https://<you>.github.io/calendar-app-tg/`.

---

## 5. Launch flow + routing + deploy

### Launch detection (`src/main.tsx`)

Three cold-start paths:

```ts
// pseudocode
const tg = window.Telegram?.WebApp
let initialRoute: string | null = null

if (tg && tg.initData) {
  // 1. Real Telegram launch (phone, real user, real initData)
  tg.ready()
  tg.expand()
  const tgUser = tg.initDataUnsafe?.user  // { id, username, first_name, ... }
  await upsertAndSetPersona(tgUser)
  const startParam = tg.initDataUnsafe?.start_param
  if (startParam?.startsWith("event_")) {
    initialRoute = `/event/${startParam.slice(6)}`
  }
}
// 2. Browser dev (DEV): persona picker as-is
// 3. Browser production (no Telegram on GH Pages): also persona picker
```

`upsertAndSetPersona`:

```ts
const { data: row } = await supabase
  .from("users")
  .upsert(
    { tg_id: tgUser.id, username: tgUser.username, first_name: tgUser.first_name },
    { onConflict: "tg_id" }
  )
  .select("id, is_admin")
  .single()
localStorage.setItem("demo.user_id", row.id)  // same key the persona picker uses
```

This is the entire "auth." `is_admin` defaults to `false` for new tg-id rows; flip manually in Supabase Studio for yourself before the demo. Persona picker is **hidden** when launched from Telegram; **shown** in browser.

### Routing — switch to HashRouter

Existing `<BrowserRouter>` in `router.tsx` becomes `<HashRouter>`. Paths unchanged: `/`, `/event/:id`, `/admin/new`. The cold-start `initialRoute` is consumed once on first mount via `<Navigate>`.

### Vite config — `base` for GH Pages

`vite.config.ts` adds `base: "/calendar-app-tg/"` (repo name; GH Pages serves at `<username>.github.io/<repo-name>/`). If a custom domain is added later, flip to `"/"`.

### GitHub Actions workflow

`.github/workflows/deploy.yml`:
- Trigger: push to `main`.
- Steps: checkout → setup Node 20 → `npm ci` → `npm run build` (env from GH secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FUNCTIONS_URL`) → `actions/upload-pages-artifact@v3` → `actions/deploy-pages@v4`.

> The bot username does **not** need to ship to the client — the Mini App receives `start_param` from Telegram and routes via React Router; it never constructs a `t.me/<bot>/<app>` link itself. `BOT_USERNAME` lives only as a Supabase secret used by the `announce` Edge Function.
- Repo setting: **Settings → Pages → Source = GitHub Actions**.

Build outputs to `dist/`. First deploy ~2 min; subsequent ~45 s.

### Supabase Cloud bootstrap (one-time, ~15 min)

1. Create project at supabase.com (region `eu-central-1`).
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push` — applies migrations `0001` + `0002` to the cloud DB.
4. Run `seed.sql` once manually in Studio (`db push` does not run seed in prod by design).
5. Copy `Project URL` + `anon key` into GitHub repo secrets.

### Edge Function deploy (one-time)

`supabase/functions/announce/index.ts` — ~60 lines (slightly larger now that it branches on `image_url` between `sendPhoto` and `sendMessage`). Uses `BOT_TOKEN`, `BOT_USERNAME`, `FORUM_CHAT_ID`, `PUBLIC_BASE_URL` from Supabase secrets.

```
npx supabase functions deploy announce --no-verify-jwt
npx supabase secrets set BOT_TOKEN=... BOT_USERNAME=... FORUM_CHAT_ID=... PUBLIC_BASE_URL=https://<you>.github.io/calendar-app-tg/
```

### BotFather one-time (~5 min)

- `/newbot` → name + username → save token.
- `/newapp` → attach Mini App, short name `calendar`, URL `https://<you>.github.io/calendar-app-tg/`.
- `/setdomain` → `<you>.github.io`.
- Add bot to demo group as admin, fetch chat ID (negative integer; any "get chat ID" bot or `getUpdates`).

### Demo-prep deploy checklist

```
git push main             # GH Actions builds + deploys to Pages
npx supabase db push      # applies 0002_phase1.sql to cloud
npx supabase functions deploy announce --no-verify-jwt
# verify in browser: https://<you>.github.io/calendar-app-tg/ → persona picker works
# verify in Telegram: open Mini App from BotFather menu → real you appears
# verify end-to-end: create event from Telegram → message lands in group → tap button → /event/:id opens
```

---

## 6. Testing + error handling

### The one test we write

The original Phase 1 spec mandates it, and it's the one thing that can't be verified by clicking around: the `rsvp_going` race.

`tests/rsvp_going.race.test.ts` (Vitest, against local Supabase):

```ts
// pseudocode
beforeAll: reset DB; insert event with capacity=5; insert 20 extra users
test:
  fire 20 parallel supabase.rpc('rsvp_going', { p_event_id, p_user_id: users[i].id })
  await Promise.allSettled
  expect( count('going' rows for event) ).toBe(5)
  expect( 15 promises rejected with 'event full' )
```

Runs against `supabase start` Postgres. ~2 s. Run locally with `npm test` before each demo.

### What we don't test

No component tests, no integration tests, no visual regression. Every other surface is fast to verify by hand and changes too quickly to be worth a harness right now.

### Client error handling matrix

| Path | Failure mode | UI behavior |
|---|---|---|
| `eventsQuery` / `eventQuery` | Network or 500 | React Query default retry (3×), then `<p>{t.common.error}</p>` |
| `rsvp_going` returns `event full` | Capacity hit | `toast.error(t.toast.eventFull)`; button re-enables |
| `rsvp_going` other error | Unknown PG error | `toast.error(err.message)` (English PG message — acceptable for unhandled paths) |
| Create event succeeds, `announce` fails | Edge fn 500 / Telegram API error | Event stays in DB; `toast.warning(t.toast.announceFailed)`. Manual retry via new event-detail button "Опублікувати в Telegram" |
| `announce` caller verification | Provided `admin_user_id` is not an admin row | Edge fn returns 403; client toast `t.common.error` |
| Telegram launch with unknown `tg_id` | First-time user | Upsert creates row with `is_admin = false`. Admin promotion is manual in Studio. |
| `start_param` points to a deleted event | Stale deep link | `/event/:id` shows `t.detail.notFound`, link back to list |

### Two deliberate non-handlings

- **No optimistic UI on RSVP.** The "Іду" button waits for the RPC to return before updating the count. Optimistic + rollback adds complexity for a feature whose whole point is "it didn't double-book." If latency on Supabase Cloud free tier is annoying during the demo we add a spinner — not optimism.
- **No retry on `announce` failure.** If the bot can't post, the event still exists; manual republish via the button covers it. Auto-retry hides bugs.

### Demo-morning smoke test (~3 min)

1. `npm run db:start && npm test` → race test green.
2. Open `https://<you>.github.io/calendar-app-tg/` in browser → list of 11 seeded events loads, dates render in `uk` locale.
3. Open Mini App from Telegram on phone → same list, identified as admin.
4. Tap "+ Нова подія" → fill in throwaway event → submit → message appears in demo group within ~2 s.
5. Tap message's button on a second device → `/event/<id>` opens, RSVP works.
6. From device 1 hit "Видалити подію" → event vanishes from list on device 2 within React Query staleTime (30 s) or on next focus.

---

## 7. Acceptance criteria

Phase 1 ships when all of these hold:

- [ ] All UI text and seed data are in Ukrainian. No leftover English strings outside of code identifiers, error fallbacks, and PG-level error messages.
- [ ] `event_type` enum is `('offline', 'online', 'trip')`. All 11 seeded events present with verbatim descriptions and the dates in the table above.
- [ ] All 11 seeded events have `image_url` set; the matching files exist in `public/events/`; the event-list cards render each poster as the dominant visual.
- [ ] `npm test` passes including the `rsvp_going` race test.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] Mini App URL `https://<you>.github.io/calendar-app-tg/` loads in browser; persona picker switches identity; calendar shows all 11 events sorted by date.
- [ ] Opening the same URL from inside Telegram identifies the real user (no persona picker visible); the user's row is upserted into `users` on first launch.
- [ ] After flipping `is_admin = true` for your row in Studio, "+ Нова подія" appears; creating an event posts a Telegram message into the configured group with a working "👉 Відкрити в застосунку" button.
- [ ] Seeded events trigger `sendPhoto` (poster rendered inline in the Telegram post); admin-created events with no image trigger `sendMessage` (text-only fallback).
- [ ] Tapping that button opens the Mini App directly at `/event/<id>` on a clean cold start (no need to navigate manually).
- [ ] A non-admin tapping the deep link sees the event detail and can RSVP (Іду / Скасувати).
- [ ] Capacity is enforced: filling an event to its limit, then attempting a further RSVP, shows `Місць не залишилось`.
- [ ] Admin can delete an event; the row + cascaded RSVPs disappear; the Telegram message stays (documented as v1.1).
- [ ] If the Edge Function returns an error during event creation, the event is still saved, the user sees `t.toast.announceFailed`, and can manually retry via the "Опублікувати в Telegram" button.

When green: tag `v0.1.0-phase1`. Update memory: bump `project_phase_mode.md` from "local-demo-only" to "phase-1-shipped".

---

## 8. What this design is NOT

- Not the production-shaped Phase 1 from `PHASE_0_AND_1.md`. That doc's `tg-auth` Edge Function, RLS policies, forum-topic routing, webhook bot, and Coolify/Hostinger setup are explicitly deferred. The architecture in this doc is the *single-session demo* refactor of that target.
- Not multi-tenant. One bot, one chat, one community. Hardcoded.
- Not a basis for paid events or recurrence. Both belong in v1.1+.
- Not security-hardened. The A1 + RLS-off trust model is documented above and is the headline of v1.1.
