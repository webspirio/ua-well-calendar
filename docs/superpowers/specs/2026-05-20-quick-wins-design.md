# Quick Wins Bundle — Design

**Date:** 2026-05-20
**Source ideas:** `docs/QUICK_WINS.md`
**Scope (option d from brainstorming):** A1, B6, C3, C4, D1, E1, F3.
B1 (reactions) and E3 (MainButton) are out of scope this round.

## Goal

Ship seven small, visible improvements against the local-demo build so the
next walk-through feels measurably more "real": an admin can mark attendance,
the list page has a hero + a "my events" filter + a hot-seats badge, the
detail page credits speakers and offers a share link, and loading states use
skeletons instead of "Завантаження…" text.

All work runs against local Supabase only. No VPS, no Telegram. Mock
`now()` = 2026-05-10 (defined in `src/lib/dates.ts`).

## Non-goals

- Setting `events.speaker_user_id` from the admin UI. v1 seeds it; an admin
  dropdown in `AdminNew.tsx` is deferred.
- Per-row reaction system (B1) — separate work.
- Telegram MainButton wiring (E3) — needs a real Telegram WebApp host.
- RLS / production migration concerns. The DB stays open as today.

## Schema (migration `0004_quick_wins.sql`)

```sql
alter table rsvps  add column attended boolean;
alter table events add column speaker_user_id uuid references users(id);
```

- `rsvps.attended` is nullable on purpose: `null = not yet marked`,
  `true = present`, `false = no-show`. Cheaper than `attended_at timestamptz`
  and matches the three-state UI toggle.
- `events.speaker_user_id` is a nullable FK to `users(id)` — most events
  won't have a designated speaker.

Both columns are purely additive. Existing rows keep working untouched.

### Seed adjustments (`supabase/seed.sql`)

- Event #4 (`11111111-1111-1111-1111-000000000004`, Workshop Штутгарт):
  set `speaker_user_id = 00000000-0000-0000-0000-000000000019` (Віталій).
  Matches the existing description line "Спікер: Віталій Горбань".
- Event #6 (`11111111-1111-1111-1111-000000000006`, Аналіз ніші):
  set `speaker_user_id = 00000000-0000-0000-0000-00000000001a` (Антон).
  Matches "Спікер: Антон Ященко".
- Add one RSVP to Велотур (`11111111-1111-1111-1111-000000000009`) so it
  goes from 11/15 to 12/15 (80%), crossing the B6 ≥75% threshold for a
  future event. Pick any seeded user not already in the list (e.g.
  Олена М., `00000000-0000-0000-0000-00000000001b`).

## Features

### A1 — Attendance check-in

**Where:** new `src/components/AttendanceSheet.tsx`, rendered inside
`EventDetail.tsx`, gated by:

```
me?.is_admin && (isToday(event.starts_at, event.ends_at) || isPast(event.ends_at))
```

The doc's original gate was `isToday(...)` only. We widen it to
`isToday || isPast` so the demo works against today's seed (mock-today is
2026-05-10; the closest "today" event is the past Яхтинг trip; many past
events exist). For the live product this gate can tighten again.

**UI:**

```
Відмітити присутніх — 6 / 8
┌────────────────────────────────────┐
│ ⬤  Олена         [✓] [✗] [—]      │
│ ⬤  Богдан        [✓] [✗] [—]      │
│ ⬤  Олександр     [✓] [✗] [—]      │
│ …                                   │
└────────────────────────────────────┘
```

- One row per RSVP with `status = 'going'`.
- The toggle is a three-state segmented control: present / no-show / unset.
- Header counter renders `attendedYes / goingTotal`.
- Live update via React Query `invalidateQueries({ queryKey: ["rsvps", eventId] })`.

**Mutation:**

```ts
supabase
  .from("rsvps")
  .update({ attended: nextValue }) // boolean | null
  .eq("event_id", eventId)
  .eq("user_id", userId)
```

No new RPC; existing rsvp row is updated in place.

### B6 — Hot / Almost-full badge

**Where:** derivation in `EventCard.tsx`. Pure compute, no schema.

```ts
const ratio = going / capacity
const hotness =
  past               ? null         :
  ratio >= 1         ? "full"       :
  ratio >= 0.75      ? "almost-full":
                       null
```

- `full` → `Badge` with text `t.list.full` ("Місць не залишилось"),
  variant `secondary`.
- `almost-full` → `Badge` with `🔥 ` + `t.list.almostFull`
  ("Майже всі місця зайнято"), rose color (`bg-rose-500 text-white`).
- Suppressed for past events (no urgency).
- Position: a new line in the card footer, below or beside the existing
  `going / capacity` counter.

### C3 — "Мої події" filter

**Where:** `TimeFilter` type + `EventFilters.tsx` + `EventList.tsx`.

```ts
export type TimeFilter = "all" | "upcoming" | "past" | "mine"
```

New chip label `t.filters.timeMine` ("Мої"). When selected:

```ts
const myEventIds = new Set(
  allRsvps
    .filter((r) => r.user_id === me.id && r.status === "going")
    .map((r) => r.event_id)
)
events.filter((ev) => myEventIds.has(ev.id))
```

Uses the existing `allRsvpsQuery()` (already exported in `queries.ts`).

Empty state for `mine` with no results: `t.list.emptyMine`
("Ви ще нікуди не зареєструвалися.").

### C4 — Next-up hero banner

**Where:** new `src/components/NextUpHero.tsx`, rendered above
`EventFilters` in `EventList.tsx`. Hidden when:
- there is no future event (`events.every(isPast)`), or
- the active time filter is `past` or `mine`.

**UI:** wide card, two columns on `sm:` and up:

```
┌──────────────┬───────────────────────────────┐
│              │  Найближча подія               │
│   poster     │  Аналіз ніші та конкурентів   │
│   (4:5)      │  11 трав (пн), 18:00          │
│              │  через 1 день                  │
└──────────────┴───────────────────────────────┘
```

- Click anywhere → `/event/:id`.
- Pick the event by sorting events ascending by `starts_at`, filter to
  `starts_at > now()`, take the first.

**`formatCountdown(startsAt: string): string`** in `dates.ts`:

| Delta from `now()` | Output |
|---|---|
| < 1 minute | "вже починається" |
| < 1 hour | "через N хв" |
| same day, ≥ 1h | "сьогодні о HH:mm" |
| next day | "завтра о HH:mm" |
| 2–6 days | "через N днів" |
| ≥ 7 days | "через N тижнів" |

`formatDistanceToNowStrict` from date-fns gives most of this; ukrainian
locale is already imported.

### D1 — Speaker badge

**Where:**
- `EventDetail.tsx` header: under the date/location lines, render
  `Спікер: {speaker.first_name}` when `event.speaker_user_id` is set.
  Reuse `usersQuery()`.
- `EventGoingList.tsx`: when a row's `user.id === event.speaker_user_id`,
  append a small `Badge` with `t.detail.speakerBadge` ("Спікер"). This
  requires `EventGoingList` to also accept (or look up) the speaker id —
  simplest: take `speakerUserId?: string` as a prop from `EventDetail`.

No mutations. `speaker_user_id` is set only via seed/Studio in v1.

### E1 — Skeleton loaders

**Where:** new shadcn primitive at `src/components/ui/skeleton.tsx`:

```ts
import { cn } from "@/lib/utils"
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}
```

Two layout-matching wrappers:

- `EventCardSkeleton.tsx` — same `aspect-[4/5]` block + two text rows +
  footer row.
- `CommentSkeleton.tsx` — avatar bubble + text rows.

Replacement points:
- `EventList.tsx` `isLoading` branch → grid of 4 `<EventCardSkeleton />`.
- `EventComments.tsx` `comments === undefined` branch → 3
  `<CommentSkeleton />` (today this state renders nothing, so this is a
  visible improvement only briefly during initial load).

### F3 — Share-event link

**Where:** new `src/components/ShareButton.tsx`, rendered in
`EventDetail.tsx`'s action button row (alongside RSVP / cancel).

```ts
const botUsername = import.meta.env.VITE_BOT_USERNAME // optional
const url = botUsername
  ? `https://t.me/${botUsername}/calendar?startapp=event_${id}`
  : `${window.location.origin}${window.location.pathname}#/event/${id}`
await navigator.clipboard.writeText(url)
toast.success(t.toast.linkCopied)
```

Visible to all users (not admin-only). Button label
`t.detail.share` ("Поділитись"), variant `outline`.

## Strings added (`src/lib/strings.ts`)

```ts
list.almostFull       = "🔥 Майже всі місця зайнято"
list.full             = "Місць не залишилось"
list.nextUpHeading    = "Найближча подія"
list.emptyMine        = "Ви ще нікуди не зареєструвалися."
filters.timeMine      = "Мої"
detail.speaker        = (name: string) => `Спікер: ${name}`
detail.speakerBadge   = "Спікер"
detail.share          = "Поділитись"
detail.attendanceHeading = (yes: number, total: number) =>
                        `Відмітити присутніх — ${yes} / ${total}`
detail.attendedYes    = "Прийшов"
detail.attendedNo     = "Не прийшов"
detail.attendedClear  = "—"
toast.linkCopied      = "Посилання скопійовано"
toast.attendanceSaved = "Збережено"
```

## Tests

- `tests/dates.test.ts` — `formatCountdown`:
  - < 1m, < 1h, same-day, "завтра", 2 days, 7 days, 14 days.
- `tests/event_filters.test.ts`:
  - `hotness(going, capacity, past)` truth table (incl. past returns null).
  - `mine` filter selects events with a `going` RSVP for the given user
    and excludes `cancelled`.
- Existing `tests/rsvp_going.race.test.ts` — must still pass.

All tests run via `npm test` (vitest, `--passWithNoTests` flag stays useful).

## Commit plan

1. `feat(db): add rsvps.attended + events.speaker_user_id + seed updates`
   — migration `0004_quick_wins.sql`, seed edits, `EventRow.speaker_user_id`,
   `RsvpRow.attended`.
2. `feat(detail): attendance check-in sheet for admins (A1)`
   — `AttendanceSheet.tsx`, strings, EventDetail wiring.
3. `feat(card): hot/almost-full badge + next-up hero + speaker badge (B6, C4, D1)`
   — `EventCard.tsx`, `NextUpHero.tsx`, `EventGoingList.tsx`,
   `EventDetail.tsx` speaker line, `dates.ts` `formatCountdown`.
4. `feat(list): "Мої події" filter (C3)`
   — `EventFilters.tsx`, `EventList.tsx`, strings, filter test.
5. `feat(ui): skeleton loaders + share-event button (E1, F3)`
   — `ui/skeleton.tsx`, `EventCardSkeleton.tsx`, `CommentSkeleton.tsx`,
   `ShareButton.tsx`, integrations.

Each commit is independently revertable.

## Verification gate (end of session)

- `npm run lint` — passes.
- `npm test` — race test + new unit tests pass.
- `npm run build` — production build succeeds.
- Manual: `npm run db:reset && npm run dev` — switch persona to admin,
  walk: list (hero, hot badge, "Мої" tab) → event detail (speaker,
  share, attendance for past event) → comments skeleton on initial load.

## Risks / open questions

- **Mock-today vs `formatCountdown`:** the hero countdown must use
  `now()` from `dates.ts`, not `new Date()`, otherwise the demo will say
  "через 5 років" against the seeded 2026 dates. Captured in implementation.
- **Speaker FK on delete:** if a user is deleted, the FK with default
  behavior raises. The app has no user-delete flow, so this is theoretical.
  Could `on delete set null` later if user-delete arrives.
- **Telegram share URL in local demo:** without `VITE_BOT_USERNAME`, the
  fallback shares a `localhost:5173/#/event/...` URL. That's fine for the
  demo (presenter pastes it into Telegram themselves) and harmless for
  prod (env var supplies the real bot username).
