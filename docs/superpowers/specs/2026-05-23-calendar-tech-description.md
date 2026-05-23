---
title: Calendar-app-tg — Technical Description (Phase 1)
date: 2026-05-23
status: draft
audience: engineering (handoff / future devs); not client-facing
related:
  - 2026-05-23-calendar-offer-options.md
  - ../../../../ua-well-crm/CLAUDE.md
---

# Calendar-app-tg — Technical Description

## 1. Context and goals

Telegram-integrated event calendar for **UA Well Community** — a Ukrainian-speaking business club in Munich + Augsburg, currently ~80 members, 1 active franchise, ~3 events/month. The client owns three German legal entities and uses Lexware (accounting), KeyCRM (CRM), Ringostat (telephony), Google Sheets (internal records), Power BI (dashboards), Telegram + WhatsApp (member comms).

This document describes the calendar module — the first production component of a longer-term platform that will eventually subsume the CRM, finance, and member-portal blocks described in the client's discovery TZ. Architectural decisions taken here must keep that long-term shape (multi-franchise tenancy, shared identity, Lexware-as-source-of-truth for finance) cheap to extend later, without building any of it now.

### Success criteria (Phase 1)

- Mini App first-contentful-paint ≤ 2 s on a mid-range phone over LTE.
- Scheduled reminders delivered within ±2 minutes of target time, 99% of the time.
- System supports 100 concurrent Mini App sessions and 500 RSVP writes/day without queueing.
- Operating cost ≤ €25/month (Supabase free tier + Hostinger VPS shared with other client work + Coolify).
- One admin can create, edit, cancel an event series and broadcast a message to attendees in under 90 seconds total UI time.

### Non-goals (Phase 1)

- No standalone web portal (no email/password login outside Telegram). Profiles in the Pro tier live inside the Mini App, not a separate web app.
- No payments processor wiring (Stripe / SEPA / Mollie). Paid events are tracked as `is_paid` with manual confirmation by admin.
- No CRM funnel, no lead capture, no Ringostat integration.
- No Lexware sync — invoices are not auto-generated; numbering remains Lexware's responsibility.
- No multi-franchise UI (one community for now); see §13 for what's reserved.
- No WhatsApp channel (cost, BSP certification lag, template approval delays).
- No real-time collaboration (no Supabase Realtime, no websockets).
- No video archive, no surveys, no referral program (deferred to Phase 2).

---

## 2. Architecture overview

Four runtime components, all on the same Hostinger VPS managed by Coolify (Traefik + Let's Encrypt). One external dependency: Supabase Cloud (free tier).

```
Telegram client (mobile/desktop)
        │
        ├─── Mini App (React + shadcn/ui, static build)  ◀───── ICS feed endpoint (signed URL)
        │            │                                                  │
        │            ▼                                                  │
        │       Supabase REST + RPC  ◀────────────────────────── Calendar apps
        │            │     (RLS-gated)                          (Google, Apple, Outlook)
        │            ▼
        └─── Bot worker (Node + grammY, webhook mode)
                     │
                     ▼
                 Supabase (Postgres + pg-cron + Edge Functions + Storage)
```

| Component | Tech | Hosted on | Public URL |
|---|---|---|---|
| Mini App (SPA) | React 19 + Vite + shadcn/ui + Tailwind | Coolify static service | `https://calendar.<domain>` |
| Bot worker | Node 22 + grammY (webhook mode) | Coolify Node service | `https://bot.<domain>/webhook` |
| ICS feed endpoint | Supabase Edge Function | Supabase | `https://<project>.supabase.co/functions/v1/ics` |
| Reminder dispatcher | Supabase Edge Function triggered by pg-cron | Supabase | (internal) |
| Database + storage | Supabase Postgres + Storage (event media) | Supabase Cloud | (internal) |

### Stack rationale

- **Supabase Cloud (not self-hosted)** — free tier covers 80 members easily; operational simplicity beats any sovereignty gain at this scale. Daily backups, point-in-time recovery, EU-region project.
- **Coolify on existing VPS** — bot worker and Mini App are tiny; share the VPS with the user's other projects. No new infra cost.
- **grammY over Telegraf** — better TypeScript types, modern API surface, smaller surface area.
- **Webhook mode (not long-polling)** — reliable on a Coolify-managed container, lower latency.

---

## 3. Data model

All tables live in the `public` schema. RLS enabled on every table; policies described inline.

### Identity and roles

```sql
-- A user is uniquely keyed by their Telegram user_id (BIGINT).
users (
  id              uuid primary key default gen_random_uuid(),
  telegram_id     bigint not null unique,
  username        text,              -- @handle, nullable
  first_name      text not null,
  last_name       text,
  language_code   text,              -- "uk", "ru", "de"...
  photo_url       text,
  franchise_id    uuid references franchises(id),  -- nullable; reserved (§13)
  -- Member tier (Tier 2+); NULL until admin assigns. Drives event audience
  -- restrictions and upgrade prompts.
  member_type     text check (member_type in ('start', 'standard', 'business')),
  -- Membership lifecycle (Pro tier feature for renewal notifications).
  membership_starts_at  timestamptz,
  membership_expires_at timestamptz,
  -- Profile fields (Pro tier). NULL by default — admin or user fills in.
  bio             text,
  occupation      text,
  company         text,
  city_residence  text,                -- 'Munich', 'Augsburg', 'Online', etc.
  profile_visibility text default 'members'  -- 'members' | 'admins-only' | 'public'
                  check (profile_visibility in ('members', 'admins-only', 'public')),
  created_at      timestamptz default now(),
  last_seen_at    timestamptz
)

roles (
  user_id   uuid references users(id) on delete cascade,
  role      text check (role in ('admin', 'manager', 'member')),
  primary key (user_id, role)
)

-- Stub for §13; one row today.
franchises (
  id        uuid primary key default gen_random_uuid(),
  slug      text unique not null,    -- 'ua-well-munich'
  name      text not null,
  city      text,
  created_at timestamptz default now()
)
```

RLS sketch:
- `users` — a user can `select` their own row; admins/managers can select all rows where `franchise_id` matches their own (or NULL for the single-franchise period). Profile-field visibility additionally gated by `profile_visibility` for non-admin viewers.
- `roles` — read-only to all authenticated; write only via service-role.

**Member type semantics (Tier 2+).** `member_type` drives event audience restrictions: if `events.audience_restricted_to` is set, only users with `member_type` in that array can register. Otherwise blocked with an upgrade-prompt UI. See §3 (Events) for the audience column.

**Profile fields (Tier 3).** Only populated when the Pro tier is purchased — `bio`, `occupation`, `company`, `city_residence` stay NULL on lower tiers and the Mini App member directory tab is hidden. The columns themselves exist on all tiers (cheaper than ALTER TABLE later).

### Events

Two-table series/instance model. Series defines recurrence rules; instances are eagerly materialized so RSVPs, capacity, reminders all hang off the instance row.

```sql
event_series (
  id              uuid primary key default gen_random_uuid(),
  franchise_id    uuid references franchises(id),  -- nullable for now
  created_by      uuid references users(id) not null,
  title           text not null,
  description     text,
  event_type      text not null,            -- 'online' | 'offline' | 'workshop' | ...
  location        text,                     -- free text; city + address for offline
  online_url      text,                     -- Zoom / Meet / etc., for online events
  recurrence_rule text,                     -- RRULE string; NULL = one-off
  recurrence_until timestamptz,             -- materialization horizon
  capacity        int,                      -- per-instance default; NULL = unlimited
  is_paid         boolean default false,
  price_cents     int,
  currency        text default 'EUR',
  -- Audience restriction (Tier 2+). NULL = open to all members.
  -- e.g., ['business'] = only Business members can RSVP;
  --       ['standard','business'] = both Standard and Business; etc.
  audience_restricted_to text[],
  created_at      timestamptz default now(),
  archived_at     timestamptz               -- soft delete
)

events (
  id                    uuid primary key default gen_random_uuid(),
  series_id             uuid references event_series(id) on delete cascade,
  starts_at             timestamptz not null,
  duration_minutes      int not null,
  -- Snapshot fields (copied from series at materialization; series edits regenerate
  -- unfilled future instances, never instances with registrations):
  title                 text not null,
  description           text,
  event_type            text not null,
  location              text,
  online_url            text,
  capacity              int,
  is_paid               boolean default false,
  price_cents           int,
  currency              text default 'EUR',
  cancellation_deadline timestamptz,        -- computed: starts_at - 7 days for paid events
  cancelled_at          timestamptz,
  cancelled_reason      text,
  created_at            timestamptz default now()
)

-- Forum-mode supergroup topic mapping. Bot posts announcements with message_thread_id.
event_type_topics (
  event_type   text primary key,
  topic_id     bigint not null,            -- Telegram message_thread_id
  display_name text
)
```

RLS:
- `events`, `event_series` — `select` open to all authenticated users (everyone sees all events).
- `insert` / `update` / `delete` — admins and managers only.

### Registrations

Six statuses match the client's TZ §56 vocabulary, mapped to English identifiers.

```sql
registrations (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references events(id) on delete cascade,
  user_id     uuid references users(id) on delete cascade,
  status      text not null check (status in (
                'confirmed',      -- зареєстрований
                'pending_mod',    -- на модерації  (Phase 1: minimal — only paid events)
                'tentative',      -- попередній запис
                'waitlist',       -- лист очікування
                'rejected',       -- відхилений
                'cancelled'       -- скасував участь
              )),
  position    int,                          -- waitlist position; NULL otherwise
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (event_id, user_id)
)
```

RLS:
- `select` — a user sees their own rows; admins/managers see all rows for their franchise.
- `insert` / `update` — a user can insert/update their own row only if status transition is allowed (state machine enforced in DB function); admins can do anything via service-role RPC.

### Reminders, broadcasts, ICS tokens, audit

```sql
-- One row per scheduled reminder. Inserted by trigger when registration becomes 'confirmed'.
reminders (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references events(id) on delete cascade,
  user_id      uuid references users(id) on delete cascade,
  fire_at      timestamptz not null,
  offset_label text,                       -- '24h' | '1h' | 'day-of'
  sent_at      timestamptz,
  failed_at    timestamptz,
  failure_reason text
)

-- Custom admin broadcast to confirmed attendees of one event.
broadcasts (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references events(id) on delete cascade,
  sent_by         uuid references users(id) not null,
  body            text not null,
  scheduled_for   timestamptz,             -- NULL = send immediately
  also_post_to_topic boolean default false,
  sent_at         timestamptz,
  recipient_count int,
  created_at      timestamptz default now()
)

broadcast_deliveries (
  broadcast_id uuid references broadcasts(id) on delete cascade,
  user_id      uuid references users(id),
  sent_at      timestamptz,
  failed_at    timestamptz,
  failure_reason text,
  primary key (broadcast_id, user_id)
)

-- Per-user ICS subscription tokens. Rotatable.
ics_feed_tokens (
  user_id      uuid primary key references users(id) on delete cascade,
  token        text not null unique,        -- random, URL-safe, 32 bytes
  created_at   timestamptz default now(),
  last_used_at timestamptz,
  rotated_from text
)

audit_log (
  id         bigserial primary key,
  actor_id   uuid references users(id),
  entity     text not null,                -- 'event' | 'registration' | 'broadcast' | ...
  entity_id  text not null,
  action     text not null,                -- 'create' | 'update' | 'cancel' | 'broadcast' | ...
  diff       jsonb,
  created_at timestamptz default now()
)
```

---

## 4. External integrations

### Telegram Bot API

- Bot worker registers a webhook on startup pointing at `https://bot.<domain>/webhook`.
- Inbound updates: `/start` (registers user, creates `users` row if missing), `/help`, plus callback queries for inline RSVP buttons in announcement messages.
- Outbound: announcements posted to forum topics via `sendMessage` with `message_thread_id`; reminders and broadcasts sent as DMs via `sendMessage` to `chat_id = telegram_id`.
- Rate limits: Telegram allows ~30 messages/sec to different users. The reminder dispatcher batches with a 50ms inter-message delay; broadcasts to 100 users complete in ~5s.
- Bot token stored as Coolify secret, not in Git.

### Telegram Mini App SDK

- Mini App opens at `https://calendar.<domain>` from a button in the bot's `/start` reply.
- Authentication: Mini App sends `initData` (signed by Telegram) in every request to Supabase. A Supabase Edge Function verifies the HMAC signature using the bot token, looks up or creates the `users` row, and returns a short-lived (1h) Supabase JWT.
- All RLS policies key off the `auth.uid()` set from that JWT.

### Calendar export

Two mechanisms, gated by tier (offer §3):

**A. Per-event "Add to calendar" button (all tiers).**
A button on each event card builds a Google Calendar / Apple Calendar / Outlook deep-link URL containing event title, time, location, description. One-shot copy — no future updates flow.

**B. Personal ICS subscription feed (Tier 2+).**
Endpoint: `GET /functions/v1/ics?token=<token>`.
- Returns RFC 5545 `text/calendar` content with all events the user has `confirmed` registrations for (plus optional `tentative` if user toggles a flag).
- Each event includes `UID`, `DTSTART`, `DTEND`, `SUMMARY`, `LOCATION`, `DESCRIPTION`, `STATUS:CONFIRMED` or `STATUS:CANCELLED`, `LAST-MODIFIED`.
- Token is per-user, rotatable from Mini App settings ("regenerate link").
- Cache header: `Cache-Control: max-age=900` (15 minutes server-side).
- Reality: Google polls ICS feeds every 8–24h, Apple ~hourly, Outlook variable. The bot DM is the real-time channel for changes; the ICS feed is the convenience layer. The offer wording reflects this honestly.

### Forum-topic posting

The community uses a forum-mode Telegram supergroup. The `event_type_topics` table maps each event type to a `message_thread_id`. When admin clicks "Publish" on an event, the bot posts:

```
📅 <b>{title}</b>
🗓 {date} • {time}
📍 {location}
{first 200 chars of description}…

[Open in Mini App]
```

…into the topic matching `event.event_type`. Inline button deep-links to the Mini App with `?start=event_<id>`.

---

## 5. Authentication and authorization

**No email/password, no Supabase Auth email flow.** Identity is Telegram-only.

Flow:
1. User opens Mini App via the bot.
2. Mini App reads `window.Telegram.WebApp.initData` and POSTs it to Edge Function `auth-mini-app`.
3. Edge Function:
   - Verifies HMAC of `initData` using `HMAC-SHA-256(bot_token, "WebAppData")` per Telegram's spec.
   - Rejects if `auth_date` is older than 24h.
   - Upserts the `users` row keyed on `telegram_id`.
   - Mints a Supabase JWT with `sub = users.id`, `role = 'authenticated'`, custom claims `telegram_id` and `roles[]`.
4. Mini App stores the JWT in memory (not localStorage — Mini App restarts cheaply, and persisted tokens are an exfiltration risk).

Admin assignment:
- Admin role is granted via insert into the `roles` table by an existing admin.
- Bootstrap: one admin Telegram user-id is set via env var `BOOTSTRAP_ADMIN_TG_IDS` and inserted on first boot.

Bot DMs (reminders, broadcasts) require the user to have started the bot at least once (Telegram limitation). On `/start`, the bot records `users.last_seen_at` so we can detect users who never opened the bot and surface them in the admin UI as "не отримуватимуть нагадування".

---

## 6. Reminders and admin broadcasts

### Reminder generation

When a `registration` row transitions to `confirmed`, a DB trigger inserts up to three `reminders` rows for that user × event:
- 24 hours before `events.starts_at` (always)
- 1 hour before (always)
- 15 minutes before (only if `event_type = 'online'`)

When a registration cancels or moves out of `confirmed`, corresponding pending reminders are soft-deleted.
When an event is edited (time change) or cancelled, all pending reminders for that event are regenerated against the new time, and a notification reminder of type `change-notice` is queued for immediate send to all confirmed attendees.

### Dispatcher

`pg_cron` runs every minute:
```sql
select cron.schedule('reminder-dispatch', '* * * * *',
  $$ select net.http_post(url := '<edge-fn-url>/dispatch-reminders') $$);
```

The Edge Function selects all `reminders` rows where `fire_at <= now()` and `sent_at IS NULL`, renders a template per event type:

- **Online template:** title, time, Zoom URL (from `events.online_url`), "Join 5 min early."
- **Offline template:** title, time, address, Google Maps deep link, parking notes, "See you there."

Templates live in code, not the DB (translatable later if needed). Each row is updated with `sent_at` or `failed_at` + reason. Telegram 429s back off exponentially (max 60s) for that user only — no global stalls.

### Admin broadcast

UI: on an event detail screen, admin sees "Send message to attendees". Fields:
- Body (free text, supports Telegram MarkdownV2 — preview pane in UI).
- Schedule for later (datetime, optional).
- Also post to topic? (checkbox).

On submit, `broadcasts` row is inserted with `scheduled_for`. A second pg-cron job ("dispatch-broadcasts") picks up due rows, fans out DMs to all `confirmed` registrants, recording per-recipient deliveries. If `also_post_to_topic` is true, the same body is additionally posted to the event-type's forum topic.

Recipient preview: before sending, the UI shows count + names of recipients (helps admin avoid surprises).

### Membership renewal notifications (Tier 3 — Pro only)

When `users.membership_expires_at` is populated, a daily pg-cron job checks for memberships expiring in:

- **30 days** — sends a friendly "30 days till renewal" DM to the member (Telegram bot), and a parallel "alert" DM to all admins/managers in their franchise. Idempotent: `membership_notice_30d_sent_at` is set on the user row after delivery, so the message goes out exactly once per renewal cycle.
- **7 days** — same pattern with `membership_notice_7d_sent_at`. Tone is more urgent. Manager DM includes a "call this member" CTA with the member's `username` and a deep-link to their profile in the Mini App.
- **0 days (expiry day)** — admin-only DM listing all memberships that expired that day, so the manager can decide whether to extend, follow up, or move the member to inactive.

Notification flags are reset when `membership_expires_at` is updated to a future date (the renewal flow).

Templates live in code; admin can override per-franchise in a future iteration (out of scope for Phase 1).

---

## 7. Recurrence

`event_series` carries an iCalendar `RRULE` (e.g., `FREQ=WEEKLY;BYDAY=TU`).

**Materialization strategy:** eager. On series create, generate the next N=12 instances. A weekly pg-cron job extends the materialization horizon for active series — always keep ≥8 weeks of future instances.

**Edits:**
- Edits to series metadata (title, description, capacity, type) propagate to **future unfilled instances only** (instances with zero registrations).
- Edits to recurrence rule itself: wipe future-unfilled instances, regenerate from the new rule.
- An instance can be detached from its series ("edit just this occurrence") — sets `series_id = NULL` and copies the snapshot fields.

**Why eager, not compute-on-read:** RSVPs, capacity, reminders, ICS feed all need stable instance IDs. Phantom rows would mean every read computes recurrence, every RSVP creates a backing row on the fly, every reminder needs reverse-lookup. Eager keeps the data model boring.

---

## 8. Admin analytics

Two tiers (see offer §3).

### Tier 2 — Basic (Розширений)

Dashboard with:
- Active events count + upcoming count (next 30 days).
- Total RSVPs in the last 30 days, broken down by status.
- Per-event attendance rate (if admin marks `attended` on registrations after the event — single-button UI).
- **Member attendance table** — admin view of all members × event counts (RSVPed / attended / no-show), sortable by activity, last visit, member_type. Backed by a SQL view.
- Monthly summary email to the admin Telegram DM (last Friday of each month): events held, total attendance, top event by attendance.

All driven by SQL views; no analytics infra.

### Tier 3 — Full (Pro)

Adds:
- **Member profile page + directory.** New `/members` route in the Mini App: searchable directory of all members with avatar, name, occupation, company, city. Tap → full profile (bio, telegram link, attended events, badges). Visibility gated by `users.profile_visibility`. Implemented as two Mini App screens + a search RPC with pg_trgm fuzzy match on name/company/location.
- **Search.** Postgres `pg_trgm` extension on `users` for fuzzy match across name + company + occupation + city_residence. Search is admin-and-member accessible; member sees only profiles the visibility setting allows.
- **Cohort retention:** of members who attended an event in month M, what % attended another event by month M+3.
- **Event-type breakdown:** average attendance, average RSVP-to-attendance ratio, average no-show count, per type.
- **No-show tracking:** members with ≥3 no-shows in last 90 days surfaced in an admin list ("learning loop": admin decides whether to follow up).
- **Manager activity:** how many events each manager created, how many broadcasts they sent (useful when client adds a second manager).
- **Membership renewal alerts** (see §6, renewal subsystem) — surfaced in admin dashboard as a count of memberships expiring in next 30 days.
- **CSV export** of registrations, events, attendance, member profiles.
- A reserved spot in the UI ("Більше аналітики у Фазі 2") that explains what additional analytics ship with the CRM phase.

Implemented as SQL views + a small `/admin/analytics` page in the Mini App + a `/members` route for the directory.

---

## 9. Architectural hooks reserved for Phase 2 (CRM)

Decisions taken now to keep the next phase cheap. None of these add work in Phase 1.

| What | Where | Why |
|---|---|---|
| `franchise_id` column on `users`, `events`, `event_series`, `registrations` | Schema | When franchisee #2 lands, no migration on the hot path — just data backfill + RLS tighten. |
| `audit_log` table populated for all admin actions | Schema + triggers | CRM phase needs lead/member action history. Building the log now is cheap; back-filling is expensive. |
| Roles in a separate `roles` table (not enum) | Schema | CRM phase introduces manager, HQ-admin, tax-consultant roles. Table form scales; enum doesn't. |
| Identity bridge: `users.telegram_id` is the natural key; nothing else assumes Telegram | Schema | Phase 2 will layer email/password (Supabase Auth) for the member portal — extra column, not a rewrite. |
| `audit_log.diff` is JSONB, not narrow per-table tables | Schema | One log shape for all entities; the CRM/finance phases get this for free. |
| ICS feed token rotation already implemented | Code | Member portal phase needs the same primitive for personal API tokens. |
| Supabase project in EU region | Infra | GDPR — required for German PII processing regardless of phase. |
| RLS turned on from day 1 | Schema | Adding RLS to a populated DB later is significantly worse than starting with it. |

What is **deliberately not built**: multi-tenant indirection in the UI (one "current franchise" everywhere), franchisee onboarding flow, HQ cross-franchise dashboard, tenant-scoped admin invites. These cost real time and the data model already supports adding them when needed.

---

## 10. Operations

### Hosting

- **Hostinger VPS** managed by **Coolify** (already provisioned for the user's other projects).
- Three Coolify services:
  - `calendar-mini-app` — static (Vite build output served by Caddy/Traefik).
  - `calendar-bot-worker` — Node container running grammY webhook server.
  - (Optional, Tier 3 only) `calendar-cron-runner` — if pg-cron limits hit. Not needed at 100-user scale.
- TLS via Let's Encrypt (Coolify-managed).
- Domains: `calendar.<client-domain>` and `bot.<client-domain>`.

### Database

- Supabase Cloud, EU-region project.
- Free tier: 500MB DB, 1GB storage, 2GB egress — comfortably enough for 80 members / years of event data.
- Daily backups (Supabase default); Point-in-Time Recovery available if upgraded (not in Phase 1).

### Monitoring

- **Sentry** (free tier) — frontend + bot worker + Edge Functions, all instrumented.
- **Uptime monitor** — Better Uptime or UptimeRobot free tier, monitors `bot.<domain>/healthz` and `calendar.<domain>` every 1 minute.
- Telegram alerts to admin DM on prolonged outage.

### Deployment

- GitHub Actions on push to `main`:
  - Build Mini App, run typecheck + tests, push to Coolify.
  - Build bot worker image, push to Coolify.
  - Apply Supabase migrations via `supabase db push` (idempotent).
- Manual gate for migrations that drop columns (rare).

### Backup strategy

- Supabase nightly automated backup (managed).
- Weekly `pg_dump` to user's S3-compatible storage (Hetzner Storage Box), 30-day retention.
- Bot token + Supabase service-role key in Coolify secrets — never in Git.

---

## 11. Security

- Telegram `initData` HMAC verified on every Edge Function call (24h freshness window).
- Supabase JWTs short-lived (1h) — refresh by re-posting `initData`.
- RLS enforced on every table; service-role key only used in Edge Functions for privileged operations.
- ICS tokens are 256-bit random, URL-safe, never returned in any RLS-readable view (only via authenticated RPC).
- Audit log is append-only (no `delete` policy).
- No PII leaves the EU region.
- Bot worker rate-limits inbound webhook calls to mitigate abuse.

---

## 12. Effort breakdown by tier

Approximate dev-days, single developer. Used to back the prices in the offer doc.

### Старт — ~13–16 dev-days

| Block | Days |
|---|---|
| Supabase schema + RLS + migrations | 2 |
| Mini App skeleton (router, theme, shadcn) | 1 |
| Auth (initData verify, JWT mint, role lookup) | 1.5 |
| Event CRUD UI (admin) + list/calendar UI (members) | 3 |
| Registration flow (RSVP, cancel, capacity, waitlist) | 2 |
| Recurrence (RRULE, eager materialization) | 1.5 |
| Bot worker (webhook, /start, forum-topic posting, RSVP callbacks) | 2 |
| Per-event "Add to calendar" deep links | 0.5 |
| Basic reminders (24h fixed offset, one template) | 1 |
| QA + buffer + deploy | 1.5 |

### Розширений — ~23–28 dev-days

Adds to Старт:
- Configurable reminders (24h+1h+15min online) and templates | +1.5
- Change-notification fan-out on event edits / cancellations | +0.5
- ICS subscription feed (Edge Function + token mgmt + Mini App UI to copy URL) | +2
- Admin broadcast (compose UI, scheduler, dispatcher, also-post-to-topic) | +2.5
- Member type column (Start / Standard / Business) + event audience restriction (block + upgrade prompt UI) | +1.5
- Member attendance table (admin view: all members × event count, sortable) | +1
- Basic analytics views + admin dashboard | +1.5
- Polish + QA increment | +1

### Pro — ~37–43 dev-days

Adds to Розширений:
- Full analytics (cohort retention, type breakdown, no-show, manager activity) | +3
- CSV export + admin analytics polish | +1
- Member profile fields (bio, occupation, company, location, telegram) + profile view & edit in Mini App | +2.5
- Member directory + search (filter by name/company/location/type) | +1.5
- Membership renewal notifications (member DM + manager DM at 30d / 7d) | +1.5
- Audit log triggers + admin viewer | +1.5
- Phase-2 architectural reservations (franchise_id columns, roles table, identity bridge prep) | +1
- 1 month "Premium" support included | (separate budget)
- QA + buffer | +2

**Note on day-rate math.** All three tiers come out at ~€105–170/day, which is below typical EU senior consulting rates. This is a deliberate "trust-builder" pricing for a first engagement with a known client — Phase 2 and Phase 3 contracts (re-negotiated after Phase 1 ships) are budgeted at standard rates.

---

## 13. Open questions to confirm with client before Phase 1 kickoff

These are blockers for sign-off, not for the offer itself.

1. **Domain.** Which subdomain on which root domain? (e.g., `events.uawell.com`?)
2. **Telegram supergroup access.** Bot needs to be added to the forum-mode supergroup with permission to post in topics. Client provides bot admin rights at kickoff.
3. **Bootstrap admin Telegram IDs.** Who are the initial 1–2 admins?
4. **Event types and topic mapping.** Final list of event types and which forum topic each posts into. Provided as a one-time CSV.
5. **Languages.** Mini App copy in Ukrainian only for Phase 1, or Ukrainian + Russian? (DE/EN deferred.)
6. **Paid events for Phase 1.** Confirmed: manual confirmation by admin (admin marks `paid` after seeing bank transfer). No processor. Cancellation deadline = `starts_at - 7 days`.
7. **Time zone.** All events in Europe/Berlin? (Probably yes — confirm.)
8. **ICS feed visibility.** Should ICS feed include `tentative` registrations by default, or `confirmed` only? Default proposal: `confirmed` only, with a toggle in Mini App settings.

---

## 14. Out of scope (explicit list)

To match the offer's out-of-scope section verbatim and prevent expectation drift:

- Standalone web portal with email/password login (Pro-tier profiles live inside the Mini App, not a separate web app).
- Payments processor (Stripe / SEPA / Mollie / Telegram Payments).
- CRM funnel, lead capture, lead forms, Ringostat integration.
- Lexware integration (no invoice generation, no number sync).
- WhatsApp bot.
- Multi-franchise UI, HQ cross-franchise dashboards.
- Video archive (private YouTube / Vimeo).
- Referral / loyalty program.
- Surveys.
- Real-time updates (Supabase Realtime, websockets).
- Native mobile apps.
- Business-connection graph (who-knows-whom). Profile pages in Pro show static fields only.

Each of these is a Phase 2/3 conversation. The data model and architecture leave them cheap to add.

---

## 15. Hosting cost transparency (for client offer)

What clients ongoing pay per month after Phase 1 ships:

| Component | Provider | Cost |
|---|---|---|
| VPS (Bot worker + Mini App static + ICS function) | Hostinger | €8–12/mo |
| Database, Auth, Storage, Edge Functions | Supabase Cloud (EU) | €0 (free tier — sufficient for ~80 members for years) |
| Domain | Any registrar | ~€10–15/yr |
| SSL | Let's Encrypt via Coolify | €0 |
| Error monitoring | Sentry free tier | €0 |
| Uptime monitoring | UptimeRobot / Better Uptime | €0 |
| Backups (nightly) | Supabase (automatic) + weekly pg_dump to Hetzner Storage Box | ~€2/mo |
| **TOTAL (Phase 1 scale)** | | **~€10–15/mo** |

At Phase 2 scale (~500 members) Supabase moves to Pro €25/mo. At Phase 3 scale (multi-franchise) the VPS may need an upgrade to €20/mo. Total tops out at ~€50/mo in the foreseeable horizon.

Maintenance tariffs (€40 / €75 / €120) are billed on top of infrastructure — they cover the developer's time for monitoring, fixes, and feature changes; the infrastructure costs above are paid directly by the client to the providers.

---

_End of technical description. Pair with `2026-05-23-calendar-offer-options.md` (client-facing, Ukrainian)._
