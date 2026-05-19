# calendar-app-tg — Phase 0 & Phase 1

A Telegram bot + Mini App event calendar for a ~100-person community. This
document covers the **setup** (Phase 0) and the **minimum end-to-end slice**
(Phase 1) needed to prove the system before adding recurrence, paid events,
and reminders.

---

## Scope philosophy

> **Build the spine before the muscles.**
> Phase 1 ends the moment one real admin can post one real event into the
> community's forum topic and one real member can tap *Going* from the Mini App.
> Everything else — recurrence, payments, reminders, tags, waitlist, edit
> flows — comes in Phase 2+.

Two principles drive this split:

1. **The auth slice is the highest-risk part of the project.** Telegram
   `initData` → Supabase JWT → RLS is where most teams stall. We do it
   end-to-end *before* any other code.
2. **A skinny vertical beats a fat horizontal.** A working RSVP flow with
   ugly UI teaches you more than a polished calendar that doesn't connect
   to anything.

---

## Target stack (locked for v1)

| Layer | Choice |
|---|---|
| Bot | **grammY** (TypeScript), webhook mode |
| Mini App | **Vite + React + TS**, `@telegram-apps/sdk-react` |
| UI kit | **shadcn/ui** (+ TelegramUI for `BackButton`/`MainButton`/haptics only) |
| Backend | **Supabase Cloud** free tier |
| Auth | Edge Function validates `initData` → mints ES256 JWT with project signing key |
| Hosting | **Coolify** on Hostinger KVM 2 VPS (Ubuntu 24.04) |
| DNS | Hostinger DNS, A records for `bot.` and `app.` subdomains |
| Repo | Monorepo (`pnpm` workspaces): `apps/bot`, `apps/web`, `supabase/` |

---

# Phase 0 — Setup

**Goal:** All infrastructure wired up. Both Coolify services deploy a
"hello world" on `git push`. Local dev loop works. No application code yet.

**Effort:** **8–12 hours with Claude Code** (~½ to 1 working day).

## 0.1 — Domain & DNS  (~30 min)

- [ ] Pick a domain (e.g. `community.example`)
- [ ] In Hostinger hPanel → Domains → DNS, add A records (TTL 300):
  - `bot.community.example → <vps-ip>`
  - `app.community.example → <vps-ip>`
  - `coolify.community.example → <vps-ip>`
- [ ] Verify with `dig +short bot.community.example` from a different network

## 0.2 — Provision the VPS  (~1 h)

- [ ] Order **Hostinger KVM 2** (2 vCPU / 8 GB) with **Ubuntu 24.04**
- [ ] In Hostinger VPS → Firewall, open ports `22, 80, 443, 8000` inbound
  (yes, port 80 must be open — Let's Encrypt HTTP-01 challenge needs it; this
  is the #1 Hostinger-specific gotcha)
- [ ] Harden:
  ```bash
  adduser deploy && usermod -aG sudo deploy
  rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
  sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/; \
          s/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' \
          /etc/ssh/sshd_config
  systemctl restart ssh
  ufw allow 22,80,443,8000/tcp && ufw enable
  apt install -y fail2ban && systemctl enable --now fail2ban
  ```
- [ ] If on 4 GB plan, add 4 GB swap (skip on 8 GB)

## 0.3 — Install Coolify  (~30 min)

- [ ] One-liner:
  ```bash
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
  ```
- [ ] Open `http://<vps-ip>:8000`, create root account
- [ ] **Settings → Instance** → set dashboard FQDN `coolify.community.example`
- [ ] Wait for cert to issue (~30 s), confirm `https://coolify.community.example`
- [ ] Drop port 8000 from UFW once dashboard works on HTTPS
- [ ] **Settings → Backups** → enable daily backup of Coolify's internal DB to
  Backblaze B2 (cheap, ~$0.10/mo)
- [ ] Copy `/data/coolify/source/.env` (encryption key) to 1Password

## 0.4 — BotFather: two bots  (~20 min)

- [ ] Talk to `@BotFather` → `/newbot` twice:
  - **Prod**: `community_calendar_bot`
  - **Dev**: `community_calendar_dev_bot`
- [ ] For each: `/setdomain` → set the Mini App URL placeholder
  (prod: `https://app.community.example`, dev: a Cloudflare Tunnel hostname
  set up in 0.7)
- [ ] `/newapp` → attach a Mini App to each bot:
  - **App name / short name**: `calendar` (lets you build deep links like
    `t.me/community_calendar_bot/calendar?startapp=event_abc`)
- [ ] Save both tokens in 1Password. **Never commit them.**

## 0.5 — Supabase Cloud project  (~30 min)

- [ ] Create project at supabase.com — region `eu-central-1` (lowest latency
  from Hostinger DE/NL DCs)
- [ ] Copy `Project URL`, `anon key`, `service_role key` to 1Password
- [ ] **Settings → API → JWT Signing Keys** — note the active key's `kid` and
  pull the private key (ES256) via the admin API; store as
  `SUPABASE_JWT_PRIVATE_KEY` in 1Password
- [ ] Install Supabase CLI locally: `brew install supabase/tap/supabase`
- [ ] `supabase init` in the repo, `supabase link --project-ref <ref>`

## 0.6 — Repo skeleton  (~1 h)

Monorepo layout:

```
calendar-app-tg/
├── apps/
│   ├── bot/                     # grammY worker
│   │   ├── src/index.ts
│   │   ├── Procfile             # bot: node dist/index.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                     # Vite + React + shadcn Mini App
│       ├── src/main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
│       └── tg-auth/index.ts     # Edge Function (verify_jwt = false)
├── scripts/
│   ├── set-webhook.ts
│   └── dev-startup.sh
├── .env.example
├── package.json                 # pnpm workspaces
├── pnpm-workspace.yaml
└── README.md
```

- [ ] Fork [Telegram-Mini-Apps/reactjs-template](https://github.com/Telegram-Mini-Apps/reactjs-template)
  into `apps/web`, upgrade deps, replace TelegramUI defaults with shadcn
  scaffold (`pnpm dlx shadcn@latest init`)
- [ ] In `apps/bot`, scaffold grammY with `webhookCallback` + Hono adapter
- [ ] Add `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - "apps/*"
  ```
- [ ] Push to GitHub (private repo)

## 0.7 — Local dev loop  (~2 h)

- [ ] Install Cloudflare Tunnel: `brew install cloudflared`
- [ ] `cloudflared tunnel login` → `cloudflared tunnel create calendar-dev`
- [ ] Route a stable hostname: `dev.community.example` →
  `cloudflared tunnel route dns calendar-dev dev.community.example`
- [ ] `~/.cloudflared/config.yml`:
  ```yaml
  tunnel: <tunnel-id>
  credentials-file: /Users/you/.cloudflared/<tunnel-id>.json
  ingress:
    - hostname: dev.community.example
      service: http://localhost:5173
    - service: http_status:404
  ```
- [ ] Update **dev bot's** BotFather Menu Button URL to
  `https://dev.community.example`
- [ ] `supabase start` — boots Postgres + GoTrue + Edge runtime locally
- [ ] Add to `apps/web/vite.config.ts`:
  ```ts
  server: {
    host: true,
    allowedHosts: ['.community.example'],
    hmr: { protocol: 'wss', host: 'dev.community.example', clientPort: 443 },
  }
  ```
- [ ] Add **mock initData** in `apps/web/src/main.tsx` for browser-only dev:
  ```ts
  if (import.meta.env.DEV && !window.Telegram?.WebApp?.initData) {
    const { mockTelegramEnv } = await import('@telegram-apps/sdk-react');
    mockTelegramEnv({ launchParams: { /* fake user 111 */ } });
  }
  ```
- [ ] Root `package.json` script:
  ```json
  "dev": "concurrently -k -n db,web,bot,tun \
            \"supabase start\" \
            \"pnpm --filter web dev\" \
            \"pnpm --filter bot dev\" \
            \"cloudflared tunnel run calendar-dev\""
  ```

## 0.8 — Coolify resources  (~2 h)

- [ ] Coolify → **Projects** → `+ New` → name `tg-calendar`
- [ ] Inside project: create Environment `production`
- [ ] **+ New Resource → Public/Private Repository** (auth via Coolify's
  GitHub App) → repo `calendar-app-tg`, branch `main`

  **bot-worker:**
  - Base directory `/apps/bot`
  - Build pack: **Nixpacks**
  - Start command: `node dist/index.js`
  - Exposes port `3000`
  - Domains: `https://bot.community.example`
  - Health check: `GET /healthz` every 30 s
  - Resource limits: 512 MB RAM, 0.5 CPU
  - Auto deploy on push: **ON**

  **mini-app:**
  - Base directory `/apps/web`
  - Build pack: **Static** (Nixpacks "Static" preset)
  - Install: `pnpm install --frozen-lockfile`
  - Build: `pnpm build`
  - Publish: `dist`
  - Domains: `https://app.community.example`
  - Auto deploy on push: **ON**

## 0.9 — Env vars in Coolify  (~30 min)

- [ ] **Project-shared (locked):**
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_PRIVATE_KEY` (PKCS8 PEM, multi-line — Coolify supports this)
  - `SUPABASE_JWT_KID`
  - `SUPABASE_PROJECT_REF`
- [ ] **bot-worker (locked, runtime only):**
  - `BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_SECRET` (random 32 bytes, generate with
    `openssl rand -hex 32`)
  - `FORUM_CHAT_ID` (the supergroup ID — negative integer)
- [ ] **mini-app (build-time):**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_BOT_API_BASE=https://bot.community.example`

## 0.10 — Hello-world deploy & webhook  (~1 h)

- [ ] `apps/bot/src/index.ts`:
  ```ts
  import { Bot, webhookCallback } from 'grammy';
  import { Hono } from 'hono';

  const bot = new Bot(process.env.BOT_TOKEN!);
  bot.command('start', (ctx) => ctx.reply('alive'));

  const app = new Hono();
  app.get('/healthz', (c) => c.text('ok'));
  app.post('/tg/:tag', webhookCallback(bot, 'hono', {
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  }));

  export default { port: 3000, fetch: app.fetch };
  ```
- [ ] Add `scripts/set-webhook.ts` (idempotent), run once after first deploy:
  ```ts
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET!;
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: `https://bot.community.example/tg/${secret.slice(0,8)}`,
      secret_token: secret,
      allowed_updates: ['message', 'callback_query'],
    }),
  });
  ```
- [ ] Push, watch Coolify deploy both services
- [ ] Visit `https://app.community.example` → blank Vite page loads with cert
- [ ] DM the bot `/start` → reply "alive"
- [ ] **Phase 0 done.**

### Phase 0 acceptance criteria

✅ `git push` to `main` redeploys both services within 2 minutes.
✅ Both subdomains serve valid TLS certs.
✅ Bot responds `alive` to `/start` in Telegram.
✅ `pnpm dev` from the repo root brings up Supabase, web, bot, and tunnel
   together, and the Mini App opens inside the dev bot in Telegram.

---

# Phase 1 — Working Minimum

**Goal:** One admin posts one one-off event into a forum topic. One member
opens the Mini App, sees the event, taps *Going*, and capacity decreases.
No over-booking. No second user gets in past capacity.

**Effort:** **30–40 hours with Claude Code** (~2 weeks at 20 h/week).

## What's IN scope

- One-off events only (no recurrence)
- Free events only (no payment, no cancellation deadline)
- One admin in the database (you), one or two regular members for dogfood
- Event fields: `title`, `description`, `location`, `starts_at`, `ends_at`,
  `capacity`, `type` (enum, hardcoded list of 2 values mapped to topics)
- Create event from the Mini App (admin only)
- List events sorted by `starts_at` (no calendar grid yet)
- Event detail page with Going / Not Going buttons
- Capacity enforced server-side; over-limit returns an error toast
- Bot posts an announcement into the matching forum topic with a deep link
  to the Mini App event page

## What's OUT of scope

- ❌ Recurring events / RRULE
- ❌ Paid events / cancellation deadlines / payments
- ❌ Waitlist (over-capacity = hard "Event full")
- ❌ Tags
- ❌ Reminders
- ❌ Edit event (delete-and-recreate is fine for v1.0)
- ❌ Manager role separation (just `is_admin` boolean)
- ❌ Calendar grid view (Phase 2)
- ❌ Inline-keyboard RSVP from chat (Mini App only)
- ❌ Push notifications, Realtime, search, filters

## Slice ordering (the critical path)

> ⚠️ **Do these in order.** Skipping ahead to UI before auth works
> end-to-end is the most common way to lose a week.

### 1.1 — Schema, RLS, capacity RPC  (4–6 h)

`supabase/migrations/0001_init.sql`:

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
  tg_message_id bigint,
  tg_chat_id bigint,
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

alter table users   enable row level security;
alter table events  enable row level security;
alter table rsvps   enable row level security;

create policy "users read self" on users
  for select using (id = auth.uid());

create policy "events read all"  on events for select using (true);
create policy "events admin write" on events for all
  using (exists (select 1 from users u where u.id = auth.uid() and u.is_admin))
  with check (exists (select 1 from users u where u.id = auth.uid() and u.is_admin));

create policy "rsvps read all"   on rsvps for select using (true);
create policy "rsvps self write" on rsvps for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- The one function that must not race.
create or replace function rsvp_going(p_event_id uuid)
returns rsvps language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_capacity int;
  v_count    int;
  v_row      rsvps;
begin
  if v_user_id is null then raise exception 'unauthenticated'; end if;

  -- lock the event row to serialize concurrent RSVPs
  select capacity into v_capacity
    from events where id = p_event_id for update;
  if v_capacity is null then raise exception 'event not found'; end if;

  select count(*) into v_count
    from rsvps where event_id = p_event_id and status = 'going';

  -- allow toggling back from 'cancelled' without consuming a slot
  if exists (select 1 from rsvps
             where event_id = p_event_id and user_id = v_user_id
             and status = 'going') then
    select * into v_row from rsvps
      where event_id = p_event_id and user_id = v_user_id;
    return v_row;
  end if;

  if v_count >= v_capacity then raise exception 'event full'; end if;

  insert into rsvps (event_id, user_id, status)
    values (p_event_id, v_user_id, 'going')
    on conflict (event_id, user_id)
    do update set status = 'going', created_at = now()
    returning * into v_row;
  return v_row;
end $$;

grant execute on function rsvp_going(uuid) to authenticated;
```

`supabase/seed.sql`:

```sql
insert into users (id, tg_id, username, is_admin)
values (gen_random_uuid(), 111, 'dev_admin', true);
```

**Acceptance:** `pgbench` or a quick TS script firing 20 parallel
`rsvp_going` calls on a `capacity = 5` event ends with exactly 5 'going'
rows. (This is the only test that *must* exist in Phase 1.)

### 1.2 — `tg-auth` Edge Function  (6–8 h)

`supabase/functions/tg-auth/index.ts` — see Appendix A for full code.

In `supabase/config.toml`:

```toml
[functions.tg-auth]
verify_jwt = false
```

**Acceptance:**
- POST `{ initDataRaw }` from the Mini App returns `{ access_token, expires_in }`.
- The token verifies against the project's JWKS.
- `supabase.auth.setSession(...)` succeeds, and a subsequent
  `from('events').select('*')` returns rows; `from('users').select('id')`
  returns exactly one row matching the caller.
- Tampering with `initDataRaw` (flip one byte) → 401.

### 1.3 — Mini App shell  (4–6 h)

- [ ] Configure `themeParams` → CSS variables so shadcn dark/light tracks
  Telegram theme
- [ ] Wire `BackButton` and `MainButton` via TelegramUI hooks
- [ ] Routing: `/` (list), `/event/:id`, `/admin/new`
- [ ] Read `start_param` from launchParams; if `event_<id>`, route to that
  event detail on cold start (so chat deep links open the right page)
- [ ] On mount: call `tg-auth`, set Supabase session, fetch `me` from `users`
- [ ] Show "Admin" badge if `is_admin`

### 1.4 — Event list page  (2–3 h)

- [ ] Simple list, sorted by `starts_at`, filtered to `starts_at >= now()`
- [ ] Card shows title, datetime, location, "X / capacity going"
- [ ] Tap → `/event/:id`
- [ ] Pull-to-refresh on Telegram WebView (Telegram handles this natively,
  just listen to `Telegram.WebApp.onEvent('viewportChanged', ...)` to refetch
  on resume)

### 1.5 — Event detail page  (2–3 h)

- [ ] Header: title, type pill, datetime, location, description
- [ ] Capacity bar: `going / capacity`
- [ ] Going/Cancel button (MainButton at bottom)
- [ ] On Going: call RPC `rsvp_going(event_id)`, optimistic update, show
  toast on error (especially `event full`)
- [ ] On Cancel: update rsvp row to `status = 'cancelled'`

### 1.6 — Admin create-event form  (4–5 h)

- [ ] Route `/admin/new` — gated by `me.is_admin`
- [ ] shadcn form + zod schema:
  ```ts
  z.object({
    title: z.string().min(3).max(80),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    starts_at: z.string().datetime(),
    ends_at: z.string().datetime(),
    capacity: z.number().int().min(1).max(500),
    type: z.enum(['meetup', 'workshop']),
  }).refine(d => new Date(d.ends_at) > new Date(d.starts_at))
  ```
- [ ] Submit → `from('events').insert(...).select().single()`
- [ ] After insert, call bot endpoint `POST /events/:id/announce` (see 1.7)
- [ ] Redirect to event detail

### 1.7 — Bot side  (4–6 h)

- [ ] `bot.command('start')`:
  - If `match` looks like `event_<id>`: reply with a deep-link button
    (`web_app: { url: 'https://app.community.example?startapp=event_<id>' }`)
  - Else: reply with a generic "Open Calendar" web_app button
- [ ] HTTP endpoint `POST /events/:id/announce` (called by Mini App after
  admin creates an event):
  - Validate the caller's JWT (the Supabase access token); confirm admin
  - Look up event + topic for `event.type` (config map, see below)
  - `bot.api.sendMessage(FORUM_CHAT_ID, text, { message_thread_id, ... })`
  - Store returned `message_id` in `events.tg_message_id`
- [ ] Topic config in env or DB (Phase 1 = env is fine):
  ```
  TYPE_TOPIC_meetup=12
  TYPE_TOPIC_workshop=34
  ```

Topic IDs: get them by sending a message in the topic via the Telegram client
and inspecting the `message_thread_id` in the bot's update log.

### 1.8 — Dogfood event  (2–3 h)

- [ ] Add 2–3 real members to the dev DB (`update users set is_admin = true
      where tg_id = <your-tg-id>`)
- [ ] Create a real "Phase 1 launch coffee" event from the Mini App
- [ ] Confirm it lands in the right forum topic with the right deep link
- [ ] Have a friend RSVP from their phone end-to-end
- [ ] Fix what breaks. **Don't move on until this works smoothly.**

## Phase 1 acceptance criteria

✅ Admin creates event from Mini App → row in `events` + announcement in
   correct forum topic with `message_thread_id`.
✅ Member opens deep link from announcement → event detail loads with their
   identity recognized (`auth.uid()` correct).
✅ Member taps *Going* → capacity counter updates, RSVP row stored.
✅ Race: 20 simultaneous RSVPs to a `capacity = 5` event → exactly 5 'going'
   rows, others get `event full` error toast.
✅ Non-admin opens `/admin/new` → blocked at UI; even if they bypass UI,
   `insert into events` fails on RLS.
✅ Tampered `initDataRaw` → 401, no session minted.
✅ One real "launch" event happened with at least 2 real members RSVPing.

When all green: **Phase 1 ships**. Cut a tag `v0.1.0`.

---

## What's next (Phase 2 preview, not in this doc)

After Phase 1 lands and you've run 1–2 real events, the next things in
priority order:

1. **Recurrence engine** (series + materialized instances + RRULE picker)
2. **Reminders** (pg_cron → Edge Function → bot)
3. **Paid events** (manual payment first, just the 7-day cancellation
   deadline logic and a paid badge — no gateway)
4. **Calendar grid view** (shadcn-ui-big-calendar)
5. **Inline-keyboard RSVP from chat** (callback_query handlers)
6. **Waitlist + auto-promote on cancel**
7. **Tags + filters**
8. **Telegram Payments** integration

---

# Appendix

## A. Full `tg-auth` Edge Function

```ts
// supabase/functions/tg-auth/index.ts   (verify_jwt = false)
import { validate, parse } from 'npm:@telegram-apps/init-data-node@2';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'npm:jose@5';

const BOT_TOKEN   = Deno.env.get('TG_BOT_TOKEN')!;
const PROJECT_REF = Deno.env.get('SUPABASE_PROJECT_REF')!;
const PRIVATE_PEM = Deno.env.get('SUPABASE_JWT_PRIVATE_KEY')!;
const KID         = Deno.env.get('SUPABASE_JWT_KID')!;
const ISS         = `https://${PROJECT_REF}.supabase.co/auth/v1`;

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const { initDataRaw } = await req.json();

  try {
    validate(initDataRaw, BOT_TOKEN, { expiresIn: 3 * 60 * 60 });
  } catch (e) {
    return new Response(`bad initData: ${(e as Error).message}`, { status: 401 });
  }
  const { user: tg } = parse(initDataRaw);
  if (!tg?.id) return new Response('no user', { status: 401 });

  const { data: row, error } = await admin
    .from('users')
    .upsert(
      { tg_id: tg.id, username: tg.username, first_name: tg.first_name },
      { onConflict: 'tg_id' },
    )
    .select('id')
    .single();
  if (error) return new Response(error.message, { status: 500 });

  const key = await importPKCS8(PRIVATE_PEM, 'ES256');
  const now = Math.floor(Date.now() / 1000);
  const access_token = await new SignJWT({
    role: 'authenticated',
    app_metadata: { provider: 'telegram', providers: ['telegram'] },
    user_metadata: { tg_id: tg.id, username: tg.username },
  })
    .setProtectedHeader({ alg: 'ES256', kid: KID, typ: 'JWT' })
    .setSubject(row.id)
    .setIssuer(ISS)
    .setAudience('authenticated')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  return Response.json({ access_token, expires_in: 3600 });
});
```

## B. Client-side session bootstrap

```ts
// apps/web/src/lib/auth.ts
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export async function bootstrapSession() {
  const { initDataRaw } = retrieveLaunchParams();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tg-auth`,
    { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initDataRaw }) },
  );
  if (!res.ok) throw new Error(`tg-auth ${res.status}`);
  const { access_token } = await res.json();
  await supabase.auth.setSession({
    access_token,
    refresh_token: access_token, // not used; we re-attest from initData
  });
}
```

## C. Bot announcement endpoint

```ts
// apps/bot/src/announce.ts
import type { Bot } from 'grammy';
import { createClient } from '@supabase/supabase-js';

const FORUM = Number(process.env.FORUM_CHAT_ID);
const TYPE_TOPIC: Record<string, number> = {
  meetup:    Number(process.env.TYPE_TOPIC_meetup),
  workshop:  Number(process.env.TYPE_TOPIC_workshop),
};

export async function announceEvent(bot: Bot, eventId: string, jwt: string) {
  const supa = createClient(
    process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } },
  );
  const { data: me } = await supa.from('users').select('is_admin').single();
  if (!me?.is_admin) throw new Error('not admin');

  const { data: ev } = await supa.from('events').select('*').eq('id', eventId).single();
  if (!ev) throw new Error('not found');

  const topic = TYPE_TOPIC[ev.type];
  const deepLink = `https://t.me/${process.env.BOT_USERNAME}/calendar?startapp=event_${ev.id}`;
  const text =
    `*${ev.title}*\n` +
    `${new Date(ev.starts_at).toUTCString()} · ${ev.location ?? ''}\n` +
    `${ev.description ?? ''}\n\n` +
    `Capacity: ${ev.capacity}\n[Open in app](${deepLink})`;

  const msg = await bot.api.sendMessage(FORUM, text, {
    message_thread_id: topic,
    parse_mode: 'Markdown',
    link_preview_options: { is_disabled: true },
  });

  // service-role write back
  const root = createClient(process.env.SUPABASE_URL!,
                           process.env.SUPABASE_SERVICE_ROLE_KEY!);
  await root.from('events')
    .update({ tg_message_id: msg.message_id, tg_chat_id: FORUM })
    .eq('id', ev.id);
}
```

## D. Common pitfalls cheat-sheet

| Symptom | Likely cause |
|---|---|
| `tg-auth` returns 401 on every request | Mixed dev/prod bot tokens (initData was signed by the *other* bot) |
| `auth.uid()` is `null` in RLS | Missing `role: 'authenticated'` claim, or wrong `iss`/`aud` |
| `invalid kid` from PostgREST | `SUPABASE_JWT_KID` doesn't match active signing key (rotated) |
| Let's Encrypt fails on first deploy | Port 80 still blocked at Hostinger VPS firewall (not just UFW) |
| Webhook silently stops receiving | Telegram dropped it after too many 5xx; check `getWebhookInfo` |
| RSVP race overshoots capacity | Forgot `FOR UPDATE` on the event row in `rsvp_going` |
| HMR hangs WebView | Add a manual "reload" dev button calling `window.location.reload()` |
| `dev.community.example` cert error | Cloudflare Tunnel hostname not yet routed — check `cloudflared tunnel route dns ...` |

## E. Reference repos (lift code from these)

- [Telegram-Mini-Apps/reactjs-template](https://github.com/Telegram-Mini-Apps/reactjs-template) — Mini App scaffold (fork this)
- [list-jonas/shadcn-ui-big-calendar](https://github.com/list-jonas/shadcn-ui-big-calendar) — calendar grid (Phase 2)
- [NickF40/EventOrganizerBot](https://github.com/NickF40/EventOrganizerBot) — capacity + waitlist patterns (Phase 2)
- [grammyjs/grammY](https://github.com/grammyjs/grammY) — bot framework docs
- [hos's initData-in-Postgres gist](https://gist.github.com/hos/20a4a83b2a4641078dacaea079517c79) — fallback auth pattern
- Supabase Edge Functions [telegram-bot example](https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/telegram-bot)

---

## Total effort recap

| Phase | Range |
|---|---|
| Phase 0 — Setup | **8–12 h** |
| Phase 1 — Working minimum | **30–40 h** |
| **Phase 0 + 1 total** | **38–52 h** |
| Full v1 (add Phases 2–9 from project plan) | **80–120 h** |

At 20 h/week with Claude Code: **Phase 0 + 1 ships in 2–2.5 calendar weeks.**
That gets you a real, running event with real members. Everything after is
upgrades on top of a working spine.
