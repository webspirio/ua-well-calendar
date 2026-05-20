# Quick Wins — ideas for the calendar app

Brainstormed 2026-05-19 against the current Phase 1 build. Each idea has a
purpose, an implementation sketch (where it lives in code), an effort
estimate, and a note on demo impact.

**Effort buckets**

- **S (≤ 1h)** — one component or one query change.
- **M (1–3h)** — new column/table, a UI section, a small mutation.
- **L (3–6h)** — multi-piece feature, new screen, multi-state mutation.

**Demo impact** — how visible the idea is during a one-tab walk-through.
"High" = audience sees it within the first 30 seconds of a screen.

---

## A. Manager / admin tools

### A1. Attendance check-in (the example) 🟢

**What:** On the day of an event, the admin opens a "Відмітити присутніх"
view inside the event detail page — list of all RSVPs with a toggle next to
each name (Прийшов / Не прийшов). Counters update live: `8 RSVP'd → 6
прийшли`. Each row exposes a small "no-show" badge if the user has missed
≥ 2 events.

**Where:**

- Schema: `rsvps.attended boolean` (or `attended_at timestamptz` if you want
  audit times). One alter-add.
- New component `AttendanceSheet.tsx` shown only when `me.is_admin` AND
  `isToday(starts_at, ends_at)`.
- Mutation: `update rsvps set attended = ? where event_id = ? and user_id = ?`.

**Effort:** M (~2h). **Demo impact:** High — operational reality.

### A2. Edit event 🟠

**What:** Replace today's "delete + recreate" with a proper edit. Reuse the
AdminNew form pre-filled from the event row. Re-publishing optionally
edits the Telegram message (`editMessageText` / `editMessageCaption`)
using the stored `tg_message_id`.

**Where:** `pages/AdminEdit.tsx` (~same as AdminNew), route `/admin/edit/:id`.

**Effort:** M (~2h). **Demo impact:** High — fixes an obvious gap admins
will ask about.

### A3. Reschedule + notify 🟠

**What:** A small "Перенести" button on the event detail (admin) — opens a
single date picker, updates `starts_at`/`ends_at`, and (optionally) posts
an "Подія перенесена" follow-up to Telegram.

**Where:** Modal on `EventDetail.tsx`. Edge Function gets a second branch
or a new `reschedule` function.

**Effort:** M (~1.5h). **Demo impact:** Medium.

### A4. Internal notes (admin-only) 🟢

**What:** A private text field per event ("Спікер просить проектор",
"Орендована кав'ярня до 22:00"). Visible only when `me.is_admin = true`.

**Where:** `events.internal_notes text`. Show below description in
`EventDetail.tsx` inside an admin-only block.

**Effort:** S (~45min). **Demo impact:** Medium — telegraphs that the tool
is for operators, not just attendees.

### A5. Promote / demote admins from UI 🟠

**What:** "Учасники Community" page listing all users with toggle to
flip `is_admin`. Today this requires SQL in Studio.

**Where:** New `/admin/members` route + `pages/AdminMembers.tsx`.

**Effort:** M (~1.5h). **Demo impact:** Medium.

### A6. Co-hosts on an event 🔵

**What:** Multi-admin per event. Useful when a workshop has a main speaker
+ a community-host who handles logistics.

**Where:** `event_hosts (event_id, user_id, role)` table. Avatar stack on
the event detail next to title showing both.

**Effort:** L (~3h). **Demo impact:** Medium.

### A7. Export attendees 🟢

**What:** Admin button "Експорт списку" — copies "Olena (@olena_sh),
Bohdan (@bohdan_l), …" to clipboard. Or downloads .csv.

**Where:** Pure client code, no schema change. Uses `navigator.clipboard`.

**Effort:** S (~30min). **Demo impact:** Low for demo, but real ops value.

### A8. Pinned comment 🟢

**What:** Admin can pin one comment per event ("Адреса оновлена:
Konigsstraße 14"). Pinned comment renders at the top of the comments list
with a distinct background and a pin icon.

**Where:** `comments.is_pinned boolean default false`. Admin-only context
menu on each comment.

**Effort:** S (~1h). **Demo impact:** High — solves a real chat problem.

---

## B. Member engagement

### B1. Reactions on comments 🟢

**What:** Below each comment, three reaction buttons (👍 ❤️ 🔥) with
counts. Tap to toggle your reaction.

**Where:** `comment_reactions (comment_id, user_id, emoji)` table with
unique on `(comment_id, user_id, emoji)`. Render counts grouped by emoji.

**Effort:** M (~2h). **Demo impact:** High — micro-interactions feel alive.

### B2. @mentions in comments 🟠

**What:** Type `@Ірина` → suggestion popup with going-members → tap to
insert. Rendered as a styled chip linking to that user's profile (later)
or just visually highlighted.

**Where:** Replace plain `<Textarea>` with a small custom input that
detects `@` and shows a portal-positioned suggestion list. Use the
existing `usersQuery`.

**Effort:** L (~3h). **Demo impact:** High.

### B3. "Bring a guest" +N 🟠

**What:** When pressing "Іду", also pick how many guests you're bringing
(0–3). Counted against capacity. Card shows "Іра +2".

**Where:** `rsvps.guest_count int default 0`. Adjust `rsvp_going` to take
`p_guest_count` and count `1 + guest_count` against capacity.

**Effort:** M (~1.5h). **Demo impact:** Medium — community-coded behavior.

### B4. Cancellation reason (optional) 🟢

**What:** When canceling RSVP, optional short reason in a sheet. Reasons
shown only to admins on the event detail (anonymized count to members).

**Where:** `rsvps.cancel_reason text`. New `cancelRsvp(eventId, reason)`
mutation.

**Effort:** S (~1h). **Demo impact:** Low for the demo, but useful for
real operators.

### B5. Add to calendar (.ics) 🟢

**What:** "Додати у мій календар" button on event detail downloads an
`.ics` file or opens a Google Calendar template URL.

**Where:** Pure client code. Build the `.ics` string from event fields.
Two buttons: Apple/.ics + Google.

**Effort:** S (~45min). **Demo impact:** Medium — feels professional.

### B6. Hot / Almost-full badge 🟢

**What:** Card badge appears when going ≥ 75% of capacity (`🔥 Майже всі
місця зайнято`). Caps at 100% with `Місць не залишилось`.

**Where:** `EventCard.tsx` — derive from `going / capacity`.

**Effort:** S (~20min). **Demo impact:** Medium — visual urgency cue.

### B7. Save / bookmark for later 🟠

**What:** Heart icon on cards/detail to bookmark events without RSVPing.
"Мої збережені" filter tab.

**Where:** `bookmarks (event_id, user_id)` table OR just localStorage. For
the demo, localStorage is enough.

**Effort:** S (~1h). **Demo impact:** Medium.

---

## C. Discoverability

### C1. Search bar 🟢

**What:** Above the filters, a text input filters by title / location /
description (client-side, case-insensitive). Highlights matched text.

**Where:** `EventList.tsx` — add `query` state + filter function.

**Effort:** S (~30min). **Demo impact:** Medium — obviously useful.

### C2. City filter 🟢

**What:** Chips derived from distinct `location` values on offline/trip
events. Replaces or augments the type filter.

**Where:** Compute distinct cities from `events`. New `EventFilters` row.

**Effort:** S (~45min). **Demo impact:** Medium.

### C3. "Мої події" tab 🟢

**What:** Time filter gains a 4th option — only events the current user
has RSVP'd "going" to.

**Where:** Add `mine` to `TimeFilter` enum. Inner join in `eventsQuery`
when `mine`, or filter client-side using `allRsvpsQuery`.

**Effort:** S (~45min). **Demo impact:** High — answers "what do I have
coming up?" — most-asked question.

### C4. "Next up" hero banner 🟢

**What:** Above the list, a single card showing the next upcoming event:
big poster + countdown ("через 18 годин"). Disappears once nothing is
upcoming.

**Where:** `EventList.tsx` — pick the first non-past event after sort.

**Effort:** S (~1h). **Demo impact:** High — first thing the audience sees.

### C5. Calendar grid view 🔵

**What:** Toggle between list view (current) and a month grid view with
small markers for each event. Tapping a day filters the list to that day.

**Where:** New `MonthGrid.tsx` component. Could use
`shadcn-ui-big-calendar` (referenced in `PHASE_0_AND_1.md`).

**Effort:** L (~5h). **Demo impact:** High — but expensive.

---

## D. Trust, safety, signals

### D1. Speaker / Host badge 🟢

**What:** Designate one user as the event's speaker (or host). Their row
in the going list gets a "Спікер" or "Ведучий" badge. Their name appears
in the event header ("Спікер: Антон Ященко").

**Where:** `events.host_user_id uuid references users(id)` (and/or
speaker_user_id). Resolve in `EventDetail.tsx`.

**Effort:** S (~1h). **Demo impact:** High — matches the existing posters
which already credit speakers.

### D2. No-show flag on user 🟠

**What:** A user with ≥ 2 no-show events (RSVPed Іду but `attended =
false`) gets a small "часто не приходить" warning visible to admins on
the going list. Pairs with A1.

**Where:** Derived metric, no schema change. Compute from `rsvps` join.

**Effort:** S (~45min, after A1). **Demo impact:** Low for the demo, but
operationally useful.

### D3. Member since / activity score 🟢

**What:** On going-list rows and comment authors, a small "з квітня 2026"
or "10 подій" subtitle. Cheap social trust signal.

**Where:** Count from `rsvps` joined to `users.created_at`.

**Effort:** S (~45min). **Demo impact:** Low — but a nice texture detail.

---

## E. Polish & UX

### E1. Skeleton loaders 🟢

**What:** Replace text "Завантаження…" with shimmer placeholders that
match the final layout (card grid skeletons, comment-row skeletons).

**Where:** `<EventCardSkeleton>` + `<CommentSkeleton>` rendered while
`isLoading`. shadcn `<Skeleton>` primitive.

**Effort:** S (~1h). **Demo impact:** High — professional feel from
launch.

### E2. Telegram theme integration 🟠

**What:** Read `Telegram.WebApp.themeParams` and apply to CSS variables.
The Mini App becomes dark when the user's Telegram is dark.

**Where:** `src/lib/launch.ts` — after `tg.ready()`, set CSS variables
on `:root` from `themeParams`. Pair with existing tailwind dark-mode
classes.

**Effort:** S (~1h). **Demo impact:** Medium — invisible if your tg is
light-themed, magical if dark.

### E3. Telegram MainButton wiring 🟠

**What:** The "Іду" / "Скасувати" button promotes to Telegram's native
MainButton at the bottom of the WebView (sticky, themed). Disappears on
admin-only screens.

**Where:** `useEffect` in `EventDetail.tsx` calling
`tg.MainButton.setText(...).show().onClick(...)`.

**Effort:** S (~1h). **Demo impact:** Very High in Telegram — feels
native.

### E4. Haptic feedback 🟢

**What:** Call `Telegram.WebApp.HapticFeedback.impactOccurred("light")`
on RSVP success, "medium" on event create, "error" on capacity-full.

**Where:** Sprinkled into existing mutation `onSuccess`/`onError`.

**Effort:** S (~30min). **Demo impact:** Medium — small but delightful in
hand.

### E5. Sticky main action button on mobile 🟢

**What:** Outside Telegram (browser visitors), the RSVP button sticks to
the bottom of the viewport on small screens instead of scrolling away.

**Where:** Tailwind `sticky bottom-0` wrapper at the action-buttons block
on `EventDetail.tsx`.

**Effort:** S (~30min). **Demo impact:** Medium.

### E6. Empty-everywhere copy review 🟢

**What:** Review every empty state (no events, no comments, filter empty,
unauth, error) and rewrite with friendly UA copy + a suggested next
action ("Створіть першу подію").

**Where:** All page-level components.

**Effort:** S (~45min). **Demo impact:** Low individually, high together.

### E7. 404 page with deep-link fallback 🟢

**What:** Catch-all route under HashRouter with a UA-localized 404,
button "До списку подій". Helpful if a stale deep link is tapped.

**Where:** Add `{ path: "*", element: <NotFound /> }` to router.

**Effort:** S (~30min). **Demo impact:** Low.

### E8. Custom favicon and OG image 🟢

**What:** Replace the Vite-default favicon with the UA WELL bird mark.
Add Open Graph tags so the URL preview looks branded when shared in
chats.

**Where:** `public/favicon.svg` + meta tags in `index.html`.

**Effort:** S (~30min). **Demo impact:** Medium — first impression.

---

## F. Telegram-side wins

### F1. Inline-keyboard RSVP from chat 🟠

**What:** Announcement message gets a second inline button: "✓ Іду". Bot
records the RSVP via callback_query handler without opening the Mini App.

**Where:** Requires a long-running bot or a webhook setup (Edge Function
in webhook mode). Out of A1 trust model — need to validate
`callback_query.from.id` against the `users.tg_id`.

**Effort:** L (~4h). **Demo impact:** Very High — peak demo moment.
(Deferred from Phase 1 spec.)

### F2. Daily reminder DM 🟠

**What:** pg_cron at 09:00 local time scrapes events happening that day
and DMs every "going" user via the bot.

**Where:** pg_cron job → Edge Function → Telegram `sendMessage` per user.

**Effort:** M (~2.5h). **Demo impact:** Medium during a meeting (you
can't see it fire). **Real value:** High.

### F3. Share-event link 🟢

**What:** "Поділитись" button on event detail copies the deep-link URL
(`t.me/<bot>/calendar?startapp=event_<id>`) — paste anywhere.

**Where:** `EventDetail.tsx` — `navigator.clipboard.writeText(...)`.

**Effort:** S (~20min). **Demo impact:** Medium.

---

## G. Analytics / community health

### G1. Mini-dashboard for admins 🟠

**What:** A small "/admin/insights" route showing 4 stat cards:
- Подій цього місяця: N
- Унікальні учасники: N
- Середня заповненість: %
- No-show rate: %

**Where:** New route, all queries against existing tables.

**Effort:** M (~2h). **Demo impact:** Medium.

### G2. Top participants leaderboard 🟢

**What:** Admin-only list of "most active members" ranked by attended
events (last 90 days). Soft recognition.

**Where:** Same dashboard. Aggregate query.

**Effort:** S (~45min, after A1). **Demo impact:** Medium.

### G3. City coverage map / list 🟢

**What:** Simple visual: list of cities the community runs events in,
with counts. Could be a static list initially; map (Leaflet) later.

**Where:** Admin dashboard, derive from `events.location`.

**Effort:** S (~45min). **Demo impact:** Medium.

---

## H. Onboarding

### H1. First-launch greeting 🟢

**What:** First time a Telegram user opens the Mini App: a one-shot
sheet "Вітаємо в UA WELL, {first_name}! Тут ви знайдете всі події
спільноти." with one tap to dismiss. Stored in localStorage.

**Where:** Effect on `main.tsx` after `bootstrapLaunch` returns
`isTelegram = true` and `users.created_at` is within last minute.

**Effort:** S (~1h). **Demo impact:** Medium.

### H2. Empty-state CTA per admin 🟢

**What:** If admin sees an empty list (no events created yet), show a big
CTA card "Створіть першу подію спільноти" → goes to /admin/new.

**Where:** `EventList.tsx` empty branch.

**Effort:** S (~30min). **Demo impact:** Low (rarely triggered) but
polished.

---

## Recommended bundle for the next session

If you want the biggest demo impact for ~6 hours of work, bundle these:

1. **A1. Attendance check-in** (the headline) — M
2. **B1. Reactions on comments** — M
3. **C3. "Мої події" filter** — S
4. **C4. "Next up" hero banner** — S
5. **D1. Speaker / Host badge** — S
6. **E1. Skeleton loaders** — S
7. **E3. MainButton wiring** — S (in-Telegram demos only)
8. **B6. Hot / Almost-full badge** — S
9. **F3. Share-event link** — S

Total estimate: ~6h. Covers manager workflow (A1), social texture (B1, D1,
B6), discoverability (C3, C4), polish (E1, E3), and Telegram-native feel
(F3, E3).

If you only have ~2h: do **A1** (the example) + **C4** (next-up banner) +
**E1** (skeletons). Those three change how the app feels more than any
others on this list.
