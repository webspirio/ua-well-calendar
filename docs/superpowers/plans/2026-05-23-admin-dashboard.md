# Admin Dashboard — Monthly Attendance & Member Insights · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a monthly compliance dashboard inside `/admin/members` (Lifetime/Monthly tabs), surface per-member lifetime insights on the Profile page, and introduce an `events.city` column so cities can be aggregated cleanly.

**Architecture:** All computation happens client-side in pure functions in `src/lib/` (no new SQL views, no new fetches). The existing `usersQuery`, `eventsQuery`, `allRsvpsQuery`, `allCommentsQuery` already deliver the working set. A single migration adds `events.city`. UI is two new components (`MonthlyMembersTable`, `MemberInsights`) plus a small `MonthPicker` and a Tabs wrapper in `AdminMembers`.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, shadcn/ui, Tailwind v4, date-fns, Vitest, Supabase (local-only — `npx supabase db reset`).

**Spec:** `docs/superpowers/specs/2026-05-23-admin-dashboard-design.md`

---

## File Structure

**New files:**
- `src/lib/attendance.ts` — single source of truth for "did this user attend this event?"
- `src/lib/monthlyStats.ts` — pure functions for the monthly table (`computeMonthly`, `MONTHLY_THRESHOLD`)
- `src/lib/memberInsights.ts` — pure functions for the Profile page (`computeInsights`)
- `src/components/MonthPicker.tsx` — ‹ May 2026 › arrow stepper
- `src/components/MonthlyMembersTable.tsx` — month-scoped member table, filters, sorting, row tinting
- `src/components/MemberInsights.tsx` — 4-up insights grid for Profile
- `src/components/ui/tabs.tsx` — shadcn primitive (added via CLI)
- `supabase/migrations/0005_event_city.sql` — adds nullable `city` column, backfills from `location`
- `tests/attendance.test.ts` — truth-table tests
- `tests/monthly_stats.test.ts` — range filtering, byType, topCity, threshold
- `tests/member_insights.test.ts` — favoriteType, topCities, attendanceRate, streak

**Modified files:**
- `src/lib/strings.ts` — add `t.members.tabs`, `t.members.monthly.*`, `t.profile.insights.*`, `t.admin.fields.city`, `t.admin.placeholders.city`
- `src/lib/queries.ts` — add `city` to `EventRow` type and `EVENT_COLS`
- `src/pages/AdminMembers.tsx` — wrap content in Tabs (Lifetime | Monthly)
- `src/pages/Profile.tsx` — render `<MemberInsights>` above the existing stat cards
- `src/pages/AdminNew.tsx` — add city field + datalist suggestions, persist to DB
- `supabase/seed.sql` — set `city` on all event inserts; add `attended` flags on a sampling of past RSVPs

**Why split `userStats.ts` into three files?**
The existing `userStats.ts` is a lifetime-stats module. The monthly and insights computations are independent, each ~80 lines with their own tests. Splitting keeps each file focused (one responsibility), keeps test files easy to navigate, and avoids one large module that's hard to hold in context.

---

## Mock-mode Notes

- `src/lib/dates.ts` exports `now()` which returns the hard-coded `2026-05-10T12:00:00+02:00`. **Use `now()` everywhere** — never `new Date()` — so the mock "today" is consistent.
- All migrations apply via `npm run db:reset` (which runs `npx supabase db reset`). No remote DB is touched.
- Tests run in `node` env (`vitest.config.ts`). No JSDOM. The plan therefore has **no React component tests** — UI is verified manually in the dev server in the final task. This matches the existing project convention.

---

## Task 1: Migration — add `events.city`

**Files:**
- Create: `supabase/migrations/0005_event_city.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0005_event_city.sql
alter table events add column city text;

-- Backfill from existing location strings (demo seed data).
-- Match the Cyrillic-transliterated names already used in the seed.
update events set city = case
  when location ilike 'online%'         then 'Online'
  when location ilike 'м. ульм%'        then 'Ульм'
  when location ilike 'ульм%'           then 'Ульм'
  when location ilike 'штутгарт%'       then 'Штутгарт'
  when location ilike 'фрайбург%'       then 'Фрайбург'
  when location ilike 'мюнхен%'         then 'Мюнхен'
  when location ilike 'аугсбург%'       then 'Аугсбург'
  when location ilike 'нюрнберг%'       then 'Нюрнберг'
  when location ilike 'регенсбург%'     then 'Регенсбург'
  when location ilike 'інгольштадт%'    then 'Інгольштадт'
  when location ilike 'фрідріхсхафен%'  then 'Фрідріхсхафен'
  when type = 'trip'                    then null
  else null
end;
```

- [ ] **Step 2: Apply the migration locally**

Run: `npm run db:reset`
Expected: prints "Applied migration 0005_event_city" without errors. Local Supabase restarts with the new column.

- [ ] **Step 3: Verify the backfill**

Run: `npx supabase db query "select id, location, city from events order by starts_at"`
Expected: every existing event row has `city` set to either a Bavarian city, "Online", or `null` (for trips/edge cases). At minimum: Фрайбург, Online, Штутгарт, Ульм, Нюрнберг, Фрідріхсхафен, Мюнхен all appear.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0005_event_city.sql
git commit -m "feat(db): add events.city column with backfill from location"
```

---

## Task 2: Extend `EventRow` type

**Files:**
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Add `city` to the `EventRow` type and SELECT list**

In `src/lib/queries.ts`, update `EventRow` and `EVENT_COLS`:

```ts
export type EventRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  city: string | null
  starts_at: string
  ends_at: string
  type: EventType
  capacity: number
  creator_id: string
  image_url: string | null
  tg_message_id: number | null
  tg_chat_id: number | null
  speaker_user_id: string | null
}

const EVENT_COLS =
  "id, title, description, location, city, starts_at, ends_at, type, capacity, creator_id, image_url, tg_message_id, tg_chat_id, speaker_user_id"
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `npx tsc -b --noEmit`
Expected: no errors. (Existing code that doesn't reference `city` continues to work because the new field is just an additional property.)

- [ ] **Step 3: Verify the existing test helper still type-checks**

The `ev()` helper in `tests/calendar_helpers.test.ts` builds a partial `EventRow`. Update it to include `city: null`:

In `tests/calendar_helpers.test.ts`, find the `ev` helper near the top and add `city: null` after `location: null`:

```ts
const ev = (
  id: string,
  starts_at: string,
  ends_at: string,
  type: EventRow["type"] = "online",
): EventRow => ({
  id,
  title: id,
  description: null,
  location: null,
  city: null,
  starts_at,
  ends_at,
  type,
  capacity: 10,
  creator_id: "x",
  image_url: null,
  tg_message_id: null,
  tg_chat_id: null,
  speaker_user_id: null,
})
```

- [ ] **Step 4: Run existing tests**

Run: `npm test`
Expected: all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries.ts tests/calendar_helpers.test.ts
git commit -m "feat(types): add city to EventRow"
```

---

## Task 3: `attendance.ts` — the hybrid rule

**Files:**
- Create: `src/lib/attendance.ts`
- Test: `tests/attendance.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/attendance.test.ts
import { describe, expect, it } from "vitest"
import { resolveAttended } from "@/lib/attendance"
import type { EventRow, RsvpRow } from "@/lib/queries"

const NOW = new Date("2026-05-10T12:00:00+02:00")

function makeEvent(endsAt: string): EventRow {
  return {
    id: "e1",
    title: "x",
    description: null,
    location: null,
    city: null,
    starts_at: endsAt,
    ends_at: endsAt,
    type: "offline",
    capacity: 10,
    creator_id: "u",
    image_url: null,
    tg_message_id: null,
    tg_chat_id: null,
    speaker_user_id: null,
  }
}

function makeRsvp(partial: Partial<RsvpRow>): RsvpRow {
  return {
    event_id: "e1",
    user_id: "u1",
    status: "going",
    attended: null,
    ...partial,
  }
}

describe("resolveAttended", () => {
  it("returns true when attended is explicitly true", () => {
    const r = makeRsvp({ attended: true, status: "cancelled" })
    expect(resolveAttended(r, makeEvent("2026-05-01T10:00:00+02:00"), NOW)).toBe(true)
  })

  it("returns false when attended is explicitly false", () => {
    const r = makeRsvp({ attended: false, status: "going" })
    expect(resolveAttended(r, makeEvent("2026-05-01T10:00:00+02:00"), NOW)).toBe(false)
  })

  it("returns false when attended is null and status is cancelled", () => {
    const r = makeRsvp({ attended: null, status: "cancelled" })
    expect(resolveAttended(r, makeEvent("2026-05-01T10:00:00+02:00"), NOW)).toBe(false)
  })

  it("returns true when attended is null, status is going, and event is past", () => {
    const r = makeRsvp({ attended: null, status: "going" })
    expect(resolveAttended(r, makeEvent("2026-05-09T10:00:00+02:00"), NOW)).toBe(true)
  })

  it("returns false when attended is null, status is going, and event is in the future", () => {
    const r = makeRsvp({ attended: null, status: "going" })
    expect(resolveAttended(r, makeEvent("2026-05-20T10:00:00+02:00"), NOW)).toBe(false)
  })

  it("treats ends_at exactly equal to now as past (attended)", () => {
    const r = makeRsvp({ attended: null, status: "going" })
    expect(resolveAttended(r, makeEvent("2026-05-10T12:00:00+02:00"), NOW)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/attendance.test.ts`
Expected: FAIL — `Cannot find module '@/lib/attendance'`.

- [ ] **Step 3: Write the minimal implementation**

```ts
// src/lib/attendance.ts
import type { EventRow, RsvpRow } from "./queries"
import { now } from "./dates"

export function resolveAttended(
  rsvp: RsvpRow,
  event: EventRow,
  reference: Date = now(),
): boolean {
  if (rsvp.attended !== null) return rsvp.attended
  if (rsvp.status !== "going") return false
  return new Date(event.ends_at).getTime() <= reference.getTime()
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/attendance.test.ts`
Expected: PASS — 6/6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/attendance.ts tests/attendance.test.ts
git commit -m "feat(stats): add resolveAttended hybrid rule"
```

---

## Task 4: `monthlyStats.ts` — per-month aggregation

**Files:**
- Create: `src/lib/monthlyStats.ts`
- Test: `tests/monthly_stats.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/monthly_stats.test.ts
import { describe, expect, it } from "vitest"
import { computeMonthly, MONTHLY_THRESHOLD } from "@/lib/monthlyStats"
import type { EventRow, RsvpRow, UserRow, CommentRow } from "@/lib/queries"

const NOW = new Date("2026-05-10T12:00:00+02:00")
const MAY_START = new Date("2026-05-01T00:00:00+02:00")
const JUN_START = new Date("2026-06-01T00:00:00+02:00")

const u = (id: string, first: string): UserRow => ({
  id,
  tg_id: Number(id) || 0,
  username: null,
  first_name: first,
  is_admin: false,
  created_at: "2025-01-01T00:00:00+02:00",
})

const ev = (
  id: string,
  ends_at: string,
  type: EventRow["type"],
  city: string | null,
): EventRow => ({
  id,
  title: id,
  description: null,
  location: null,
  city,
  starts_at: ends_at,
  ends_at,
  type,
  capacity: 10,
  creator_id: "x",
  image_url: null,
  tg_message_id: null,
  tg_chat_id: null,
  speaker_user_id: null,
})

const rsvp = (event_id: string, user_id: string, partial: Partial<RsvpRow> = {}): RsvpRow => ({
  event_id,
  user_id,
  status: "going",
  attended: null,
  ...partial,
})

describe("computeMonthly", () => {
  const alice = u("1", "Alice")
  const bob = u("2", "Bob")
  const events: EventRow[] = [
    ev("e1", "2026-05-04T20:00:00+02:00", "offline", "Ульм"),
    ev("e2", "2026-05-07T20:00:00+02:00", "offline", "Штутгарт"),
    ev("e3", "2026-05-09T20:00:00+02:00", "online", null),
    // April event — outside the range
    ev("e4", "2026-04-20T20:00:00+02:00", "offline", "Ульм"),
    // June event — outside the range
    ev("e5", "2026-06-02T20:00:00+02:00", "trip", null),
  ]
  const comments: CommentRow[] = []

  it("counts only past + going + in-range events per user", () => {
    const rsvps: RsvpRow[] = [
      rsvp("e1", "1"), // past, going → counts
      rsvp("e2", "1"), // past, going → counts
      rsvp("e3", "1"), // past, going → counts
      rsvp("e4", "1"), // outside range → excluded
      rsvp("e5", "1"), // outside range → excluded
      rsvp("e1", "2"), // past, going → counts
    ]
    const rows = computeMonthly([alice, bob], { events, rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)

    const aliceRow = rows.find((r) => r.user.id === "1")!
    const bobRow = rows.find((r) => r.user.id === "2")!
    expect(aliceRow.attendedCount).toBe(3)
    expect(bobRow.attendedCount).toBe(1)
  })

  it("buckets byType correctly", () => {
    const rsvps: RsvpRow[] = [
      rsvp("e1", "1"),
      rsvp("e2", "1"),
      rsvp("e3", "1"),
    ]
    const rows = computeMonthly([alice], { events, rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows[0].byType).toEqual({ offline: 2, online: 1, trip: 0 })
  })

  it("picks topCity by count, tiebreaks alphabetically with uk locale", () => {
    const rsvps: RsvpRow[] = [
      rsvp("e1", "1"), // Ульм
      rsvp("e2", "1"), // Штутгарт
    ]
    // 1 vs 1 → У precedes Ш in Ukrainian, so Ульм wins
    const rows = computeMonthly([alice], { events, rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows[0].topCity).toBe("Ульм")
  })

  it("returns null topCity when all attended events have null city", () => {
    const rsvps: RsvpRow[] = [
      rsvp("e3", "1"), // online, city=null
    ]
    const rows = computeMonthly([alice], { events, rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows[0].topCity).toBeNull()
  })

  it("sets meetsThreshold based on MONTHLY_THRESHOLD", () => {
    expect(MONTHLY_THRESHOLD).toBe(2)
    const rsvps: RsvpRow[] = [
      rsvp("e1", "1"),
      rsvp("e2", "1"),
      rsvp("e1", "2"), // bob: 1 — below
    ]
    const rows = computeMonthly([alice, bob], { events, rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows.find((r) => r.user.id === "1")!.meetsThreshold).toBe(true)
    expect(rows.find((r) => r.user.id === "2")!.meetsThreshold).toBe(false)
  })

  it("uses ends_at (not starts_at) for range bucketing — trip spanning months", () => {
    const trip = ev("trip-cross", "2026-05-02T18:00:00+02:00", "trip", null)
    trip.starts_at = "2026-04-28T12:00:00+02:00" // starts in April, ends in May
    const rsvps: RsvpRow[] = [rsvp("trip-cross", "1")]
    const rows = computeMonthly([alice], { events: [trip], rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows[0].attendedCount).toBe(1) // counted in May (ends_at is in May)
  })

  it("excludes cancelled RSVPs", () => {
    const rsvps: RsvpRow[] = [
      rsvp("e1", "1", { status: "cancelled" }),
      rsvp("e2", "1"),
    ]
    const rows = computeMonthly([alice], { events, rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows[0].attendedCount).toBe(1)
  })

  it("respects explicit attended=false even when going + past", () => {
    const rsvps: RsvpRow[] = [
      rsvp("e1", "1", { attended: false }),
      rsvp("e2", "1"),
    ]
    const rows = computeMonthly([alice], { events, rsvps, comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows[0].attendedCount).toBe(1)
  })

  it("returns one row per user, in input order", () => {
    const rows = computeMonthly([alice, bob], { events, rsvps: [], comments }, {
      start: MAY_START, end: JUN_START,
    }, NOW)
    expect(rows.map((r) => r.user.id)).toEqual(["1", "2"])
    expect(rows.every((r) => r.attendedCount === 0)).toBe(true)
    expect(rows.every((r) => r.topCity === null)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/monthly_stats.test.ts`
Expected: FAIL — `Cannot find module '@/lib/monthlyStats'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/monthlyStats.ts
import type { EventRow, EventType, UserRow } from "./queries"
import type { StatsContext } from "./userStats"
import { resolveAttended } from "./attendance"
import { now as defaultNow } from "./dates"

export const MONTHLY_THRESHOLD = 2

export type MonthlyMemberRow = {
  user: UserRow
  attendedCount: number
  byType: { offline: number; online: number; trip: number }
  topCity: string | null
  meetsThreshold: boolean
}

function isInRange(event: EventRow, range: { start: Date; end: Date }): boolean {
  const endTs = new Date(event.ends_at).getTime()
  return endTs >= range.start.getTime() && endTs < range.end.getTime()
}

function pickTopCity(cityCounts: Map<string, number>): string | null {
  if (cityCounts.size === 0) return null
  const entries = [...cityCounts.entries()]
  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    return a[0].localeCompare(b[0], "uk")
  })
  return entries[0][0]
}

export function computeMonthly(
  users: UserRow[],
  ctx: StatsContext,
  range: { start: Date; end: Date },
  reference: Date = defaultNow(),
): MonthlyMemberRow[] {
  const eventsById = new Map<string, EventRow>(ctx.events.map((e) => [e.id, e]))
  const inRange = new Set(ctx.events.filter((e) => isInRange(e, range)).map((e) => e.id))

  return users.map((user) => {
    const byType = { offline: 0, online: 0, trip: 0 } as Record<EventType, number>
    const cityCounts = new Map<string, number>()
    let attendedCount = 0

    for (const r of ctx.rsvps) {
      if (r.user_id !== user.id) continue
      if (!inRange.has(r.event_id)) continue
      const ev = eventsById.get(r.event_id)
      if (!ev) continue
      if (!resolveAttended(r, ev, reference)) continue
      attendedCount += 1
      byType[ev.type] += 1
      if (ev.city) cityCounts.set(ev.city, (cityCounts.get(ev.city) ?? 0) + 1)
    }

    return {
      user,
      attendedCount,
      byType,
      topCity: pickTopCity(cityCounts),
      meetsThreshold: attendedCount >= MONTHLY_THRESHOLD,
    }
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/monthly_stats.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/monthlyStats.ts tests/monthly_stats.test.ts
git commit -m "feat(stats): add computeMonthly for monthly attendance dashboard"
```

---

## Task 5: `memberInsights.ts` — lifetime per-user insights

**Files:**
- Create: `src/lib/memberInsights.ts`
- Test: `tests/member_insights.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/member_insights.test.ts
import { describe, expect, it } from "vitest"
import { computeInsights } from "@/lib/memberInsights"
import type { CommentRow, EventRow, RsvpRow, UserRow } from "@/lib/queries"

const NOW = new Date("2026-05-10T12:00:00+02:00")

const u = (id: string): UserRow => ({
  id,
  tg_id: 0,
  username: null,
  first_name: id,
  is_admin: false,
  created_at: "2025-01-01T00:00:00+02:00",
})

const ev = (
  id: string,
  ends_at: string,
  type: EventRow["type"],
  city: string | null,
): EventRow => ({
  id,
  title: id,
  description: null,
  location: null,
  city,
  starts_at: ends_at,
  ends_at,
  type,
  capacity: 10,
  creator_id: "x",
  image_url: null,
  tg_message_id: null,
  tg_chat_id: null,
  speaker_user_id: null,
})

const rsvp = (event_id: string, user_id: string, partial: Partial<RsvpRow> = {}): RsvpRow => ({
  event_id,
  user_id,
  status: "going",
  attended: null,
  ...partial,
})

const comments: CommentRow[] = []

describe("computeInsights", () => {
  it("returns zeros and nulls for a user with no RSVPs", () => {
    const i = computeInsights(u("1"), { events: [], rsvps: [], comments }, NOW)
    expect(i.totalAttended).toBe(0)
    expect(i.favoriteType).toBeNull()
    expect(i.topCities).toEqual([])
    expect(i.attendanceRate).toBeNull()
    expect(i.complianceStreak).toBe(0)
  })

  it("computes favoriteType with rounded percentage", () => {
    const events = [
      ev("a", "2026-04-01T20:00:00+02:00", "offline", "Ульм"),
      ev("b", "2026-04-02T20:00:00+02:00", "offline", "Ульм"),
      ev("c", "2026-04-03T20:00:00+02:00", "online", null),
    ]
    const rsvps = [rsvp("a", "1"), rsvp("b", "1"), rsvp("c", "1")]
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.favoriteType).toEqual({ type: "offline", count: 2, pct: 67 })
  })

  it("returns top 3 cities sorted by count desc, alphabetical tiebreak", () => {
    const events = [
      ev("a", "2026-04-01T20:00:00+02:00", "offline", "Мюнхен"),
      ev("b", "2026-04-02T20:00:00+02:00", "offline", "Мюнхен"),
      ev("c", "2026-04-03T20:00:00+02:00", "offline", "Мюнхен"),
      ev("d", "2026-04-04T20:00:00+02:00", "offline", "Ульм"),
      ev("e", "2026-04-05T20:00:00+02:00", "offline", "Ульм"),
      ev("f", "2026-04-06T20:00:00+02:00", "offline", "Аугсбург"),
      ev("g", "2026-04-07T20:00:00+02:00", "offline", "Штутгарт"),
    ]
    const rsvps = events.map((e) => rsvp(e.id, "1"))
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.topCities).toEqual([
      { city: "Мюнхен", count: 3 },
      { city: "Ульм", count: 2 },
      { city: "Аугсбург", count: 1 }, // А precedes Ш in uk locale
    ])
  })

  it("ignores events with null city in topCities", () => {
    const events = [
      ev("a", "2026-04-01T20:00:00+02:00", "online", null),
      ev("b", "2026-04-02T20:00:00+02:00", "offline", "Ульм"),
    ]
    const rsvps = [rsvp("a", "1"), rsvp("b", "1")]
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.topCities).toEqual([{ city: "Ульм", count: 1 }])
  })

  it("computes attendanceRate over explicit attended decisions only", () => {
    const events = [
      ev("a", "2026-04-01T20:00:00+02:00", "offline", "Ульм"),
      ev("b", "2026-04-02T20:00:00+02:00", "offline", "Ульм"),
      ev("c", "2026-04-03T20:00:00+02:00", "offline", "Ульм"),
    ]
    // attended=true, attended=false, attended=null (excluded from denominator)
    const rsvps = [
      rsvp("a", "1", { attended: true }),
      rsvp("b", "1", { attended: false }),
      rsvp("c", "1", { attended: null }),
    ]
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    // denominator = 2 (only the two with explicit values), numerator = 1
    expect(i.attendanceRate).toBe(0.5)
  })

  it("returns null attendanceRate when no RSVP has an explicit attended decision", () => {
    const events = [ev("a", "2026-04-01T20:00:00+02:00", "offline", "Ульм")]
    const rsvps = [rsvp("a", "1", { attended: null })]
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.attendanceRate).toBeNull()
  })

  it("computes complianceStreak from prior month back when current month has < 2", () => {
    // current month (May) has 1 attended → start from April
    // April has 2 attended → streak continues
    // March has 2 attended → streak continues
    // February has 1 attended → stop
    const events = [
      ev("may1", "2026-05-04T20:00:00+02:00", "offline", "Ульм"),
      ev("apr1", "2026-04-04T20:00:00+02:00", "offline", "Ульм"),
      ev("apr2", "2026-04-10T20:00:00+02:00", "offline", "Ульм"),
      ev("mar1", "2026-03-04T20:00:00+02:00", "offline", "Ульм"),
      ev("mar2", "2026-03-10T20:00:00+02:00", "offline", "Ульм"),
      ev("feb1", "2026-02-04T20:00:00+02:00", "offline", "Ульм"),
    ]
    const rsvps = events.map((e) => rsvp(e.id, "1"))
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.complianceStreak).toBe(2) // April + March
  })

  it("counts current month in streak when it already has >= 2 attended", () => {
    const events = [
      ev("may1", "2026-05-04T20:00:00+02:00", "offline", "Ульм"),
      ev("may2", "2026-05-07T20:00:00+02:00", "offline", "Ульм"),
      ev("apr1", "2026-04-04T20:00:00+02:00", "offline", "Ульм"),
      ev("apr2", "2026-04-10T20:00:00+02:00", "offline", "Ульм"),
    ]
    const rsvps = events.map((e) => rsvp(e.id, "1"))
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.complianceStreak).toBe(2) // May + April
  })

  it("skips empty community months in streak (does not break the chain)", () => {
    // May: 0 community events at all → skip
    // April: user attended 2 → counts
    // March: 0 community events → skip
    // February: user attended 2 → counts
    // January: user attended 1 → stop
    const events = [
      ev("apr1", "2026-04-04T20:00:00+02:00", "offline", "Ульм"),
      ev("apr2", "2026-04-10T20:00:00+02:00", "offline", "Ульм"),
      ev("feb1", "2026-02-04T20:00:00+02:00", "offline", "Ульм"),
      ev("feb2", "2026-02-10T20:00:00+02:00", "offline", "Ульм"),
      ev("jan1", "2026-01-04T20:00:00+02:00", "offline", "Ульм"),
    ]
    const rsvps = events.map((e) => rsvp(e.id, "1"))
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.complianceStreak).toBe(2)
  })

  it("favoriteType tiebreaks by enum order: offline > online > trip", () => {
    const events = [
      ev("a", "2026-04-01T20:00:00+02:00", "online", null),
      ev("b", "2026-04-02T20:00:00+02:00", "offline", "Ульм"),
    ]
    const rsvps = [rsvp("a", "1"), rsvp("b", "1")]
    const i = computeInsights(u("1"), { events, rsvps, comments }, NOW)
    expect(i.favoriteType?.type).toBe("offline")
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/member_insights.test.ts`
Expected: FAIL — `Cannot find module '@/lib/memberInsights'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/memberInsights.ts
import { startOfMonth, subMonths, addMonths } from "date-fns"
import type { EventType, EventRow, UserRow } from "./queries"
import type { StatsContext } from "./userStats"
import { computeMonthly, MONTHLY_THRESHOLD } from "./monthlyStats"
import { resolveAttended } from "./attendance"
import { now as defaultNow } from "./dates"

export type MemberInsights = {
  totalAttended: number
  favoriteType: { type: EventType; count: number; pct: number } | null
  topCities: { city: string; count: number }[]
  attendanceRate: number | null
  complianceStreak: number
}

const TYPE_ORDER: EventType[] = ["offline", "online", "trip"]

export function computeInsights(
  user: UserRow,
  ctx: StatsContext,
  reference: Date = defaultNow(),
): MemberInsights {
  const eventsById = new Map<string, EventRow>(ctx.events.map((e) => [e.id, e]))
  const userRsvps = ctx.rsvps.filter((r) => r.user_id === user.id)

  // Pass 1: total attended + byType + cityCounts (lifetime, attended only)
  const typeCounts: Record<EventType, number> = { offline: 0, online: 0, trip: 0 }
  const cityCounts = new Map<string, number>()
  let totalAttended = 0
  for (const r of userRsvps) {
    const ev = eventsById.get(r.event_id)
    if (!ev) continue
    if (!resolveAttended(r, ev, reference)) continue
    totalAttended += 1
    typeCounts[ev.type] += 1
    if (ev.city) cityCounts.set(ev.city, (cityCounts.get(ev.city) ?? 0) + 1)
  }

  // favoriteType: highest count, tiebreak by TYPE_ORDER
  let favoriteType: MemberInsights["favoriteType"] = null
  if (totalAttended > 0) {
    let bestType: EventType = TYPE_ORDER[0]
    let bestCount = typeCounts[bestType]
    for (const t of TYPE_ORDER) {
      if (typeCounts[t] > bestCount) {
        bestType = t
        bestCount = typeCounts[t]
      }
    }
    favoriteType = {
      type: bestType,
      count: bestCount,
      pct: Math.round((bestCount / totalAttended) * 100),
    }
  }

  // topCities: sort by count desc, alphabetical tiebreak (uk locale), top 3
  const topCities = [...cityCounts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0], "uk")
    })
    .slice(0, 3)
    .map(([city, count]) => ({ city, count }))

  // attendanceRate: numerator = attended=true, denominator = attended is non-null
  let explicitYes = 0
  let explicitTotal = 0
  for (const r of userRsvps) {
    if (r.attended === null) continue
    explicitTotal += 1
    if (r.attended === true) explicitYes += 1
  }
  const attendanceRate = explicitTotal === 0 ? null : explicitYes / explicitTotal

  // complianceStreak
  const complianceStreak = computeStreak(user, ctx, reference)

  return { totalAttended, favoriteType, topCities, attendanceRate, complianceStreak }
}

function computeStreak(user: UserRow, ctx: StatsContext, reference: Date): number {
  // Find the set of months that had ANY community events (used to skip dry months).
  const communityMonths = new Set<string>()
  for (const e of ctx.events) {
    const d = new Date(e.ends_at)
    communityMonths.add(monthKey(d))
  }

  let streak = 0
  let cursor = startOfMonth(reference)

  // Skip current month if it doesn't yet have >= 2 attended.
  const currentRow = monthRow(user, ctx, cursor, reference)
  if (currentRow.attendedCount < MONTHLY_THRESHOLD) {
    cursor = startOfMonth(subMonths(cursor, 1))
  }

  // Walk back; stop when a month with community events fails the threshold.
  // Skip months with zero community events entirely.
  // Safety cap: 60 months back.
  for (let i = 0; i < 60; i++) {
    if (!communityMonths.has(monthKey(cursor))) {
      cursor = startOfMonth(subMonths(cursor, 1))
      continue
    }
    const row = monthRow(user, ctx, cursor, reference)
    if (row.attendedCount < MONTHLY_THRESHOLD) break
    streak += 1
    cursor = startOfMonth(subMonths(cursor, 1))
  }

  return streak
}

function monthRow(user: UserRow, ctx: StatsContext, monthStart: Date, reference: Date) {
  const range = {
    start: startOfMonth(monthStart),
    end: startOfMonth(addMonths(monthStart, 1)),
  }
  return computeMonthly([user], ctx, range, reference)[0]
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/member_insights.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/memberInsights.ts tests/member_insights.test.ts
git commit -m "feat(stats): add computeInsights for lifetime member profile"
```

---

## Task 6: Strings — add new UI labels

**Files:**
- Modify: `src/lib/strings.ts`

- [ ] **Step 1: Add new keys to the existing `t` object**

In `src/lib/strings.ts`, add a `tabs` block and a `monthly` block under `t.members`, an `insights` block under `t.profile`, and `city` keys under `t.admin.fields` / `t.admin.placeholders`.

Replace the `members` block by adding new keys (keep existing ones untouched):

```ts
  members: {
    navLink: "Учасники",
    heading: "Учасники Community",
    headingCount: (n: number) => `Учасники Community · ${n}`,
    searchPlaceholder: "Пошук за іменем або username…",
    showAdminsOnly: "Лише адміни",
    sortLabel: "Сортувати:",
    sortActivity: "За активністю",
    sortName: "За іменем",
    sortRecent: "Нещодавно приєдналися",
    empty: "Не знайдено учасників.",
    stats: {
      upcoming: "Майбутні",
      past: "Відвідано",
      comments: "Коментарі",
      cancelled: "Скасовано",
      engagement: "Активність",
    },
    memberSince: (dateLabel: string) => `Учасник з ${dateLabel}`,
    lastActivity: (dateLabel: string) => `Остання активність: ${dateLabel}`,
    noLastActivity: "Поки що без активності",
    tabs: {
      lifetime: "За весь час",
      monthly: "По місяцях",
    },
    monthly: {
      heading: (month: string) => `Активність · ${month}`,
      colMember: "Учасник",
      colAttended: "Відвідано",
      colTypes: "Типи",
      colTopCity: "Місто",
      belowThresholdOnly: "Менше ніж 2",
      none: "—",
      emptyMonth: (month: string) => `У ${month} ще не було подій.`,
      noMatch: "Ніхто не відповідає фільтрам.",
      typeShort: { offline: "О", online: "⊘", trip: "✈" },
      typeFull: { offline: "Офлайн", online: "Онлайн", trip: "Подорож" },
    },
  },
```

Replace the `profile` block by adding `insights`:

```ts
  profile: {
    headingFallback: "Профіль учасника",
    notFound: "Учасника не знайдено.",
    upcoming: "Майбутні події",
    past: "Минулі події",
    recentComments: "Останні коментарі",
    noUpcoming: "Поки немає майбутніх подій.",
    noPast: "Поки немає відвіданих подій.",
    noComments: "Поки немає коментарів.",
    adminActions: "Дії адміністратора",
    promote: "Зробити адміном",
    demote: "Зняти права адміна",
    promoting: "Збереження…",
    cannotDemoteSelf: "Ви не можете зняти права з себе",
    insights: {
      heading: "Статистика",
      empty: "Поки що без активності",
      totalAttended: "Усього відвідано",
      attendanceRate: "Рейтинг присутності",
      attendanceRateUnknown: "Поки що без відміток",
      favoriteType: "Улюблений формат",
      favoriteTypeShare: (type: string, pct: number) => `${type} · ${pct}%`,
      streak: (n: number) => `${n} ${pluralMonth(n)}`,
      streakLabel: "Серія місяців ≥2",
      streakFire: "🔥",
      topCities: "Топ міст",
    },
  },
```

Add a `pluralMonth` helper near the bottom of the file (before `export type EventType`):

```ts
function pluralMonth(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "місяць"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "місяці"
  return "місяців"
}
```

Update `t.admin.fields` and `t.admin.placeholders` to add `city`:

```ts
    fields: {
      title: "Назва",
      description: "Опис",
      location: "Місце",
      city: "Місто",
      startsAt: "Початок",
      endsAt: "Кінець",
      capacity: "Кількість місць",
      type: "Тип",
    },
    placeholders: {
      title: "Наприклад: Workshop у Штутгарті",
      description: "Розкажіть про подію кілька речень…",
      location: "Місто, адреса або «Online»",
      city: "Мюнхен, Ульм, Online…",
    },
```

- [ ] **Step 2: Verify the file still type-checks**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/strings.ts
git commit -m "feat(i18n): add strings for monthly tab, insights, city field"
```

---

## Task 7: `MonthPicker` component

**Files:**
- Create: `src/components/MonthPicker.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/MonthPicker.tsx
import { addMonths, format } from "date-fns"
import { uk } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  month: Date           // any date inside the month
  onChange: (next: Date) => void
}

export function MonthPicker({ month, onChange }: Props) {
  const label = format(month, "LLLL yyyy", { locale: uk })
  return (
    <div className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Previous month"
        onClick={() => onChange(addMonths(month, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[9rem] text-center font-medium capitalize tabular-nums">
        {label}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Next month"
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MonthPicker.tsx
git commit -m "feat(ui): add MonthPicker arrow stepper"
```

---

## Task 8: `MonthlyMembersTable` component

**Files:**
- Create: `src/components/MonthlyMembersTable.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/MonthlyMembersTable.tsx
import { useMemo, useState } from "react"
import { Link } from "react-router"
import { startOfMonth, endOfMonth, addMonths } from "date-fns"
import { CircleCheck, CircleX, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AvatarStack } from "@/components/AvatarStack"
import { MonthPicker } from "@/components/MonthPicker"
import { computeMonthly, MONTHLY_THRESHOLD, type MonthlyMemberRow } from "@/lib/monthlyStats"
import type { CommentRow, EventRow, RsvpRow, UserRow } from "@/lib/queries"
import { now } from "@/lib/dates"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type Props = {
  users: UserRow[]
  events: EventRow[]
  rsvps: RsvpRow[]
  comments: CommentRow[]
  searchQuery: string
}

type SortDir = "asc" | "desc"

export function MonthlyMembersTable({ users, events, rsvps, comments, searchQuery }: Props) {
  const [month, setMonth] = useState<Date>(() => startOfMonth(now()))
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [belowOnly, setBelowOnly] = useState(false)

  const range = useMemo(
    () => ({ start: startOfMonth(month), end: startOfMonth(addMonths(month, 1)) }),
    [month],
  )

  const monthHasEvents = useMemo(
    () => events.some((e) => {
      const ts = new Date(e.ends_at).getTime()
      return ts >= range.start.getTime() && ts < range.end.getTime()
    }),
    [events, range],
  )

  const rows = useMemo(
    () => computeMonthly(users, { events, rsvps, comments }, range),
    [users, events, rsvps, comments, range],
  )

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = rows
    if (q) {
      list = list.filter(
        (r) =>
          r.user.first_name?.toLowerCase().includes(q) ||
          r.user.username?.toLowerCase().includes(q),
      )
    }
    if (belowOnly) list = list.filter((r) => !r.meetsThreshold)
    const sorted = [...list].sort((a, b) =>
      sortDir === "asc" ? a.attendedCount - b.attendedCount : b.attendedCount - a.attendedCount,
    )
    return sorted
  }, [rows, searchQuery, belowOnly, sortDir])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker month={month} onChange={setMonth} />
        <Button
          type="button"
          variant={belowOnly ? "default" : "outline"}
          size="sm"
          className="h-7 px-3"
          onClick={() => setBelowOnly((v) => !v)}
        >
          {t.members.monthly.belowThresholdOnly}
        </Button>
      </div>

      {!monthHasEvents ? (
        <p className="text-muted-foreground py-8 text-center">
          {t.members.monthly.emptyMonth(monthLabel(month))}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {t.members.monthly.noMatch}
        </p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2 border-b text-xs text-muted-foreground uppercase tracking-wide">
            <span>{t.members.monthly.colMember}</span>
            <button
              type="button"
              className="text-left hover:text-foreground"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            >
              {t.members.monthly.colAttended} {sortDir === "asc" ? "↑" : "↓"}
            </button>
            <span>{t.members.monthly.colTypes}</span>
            <span>{t.members.monthly.colTopCity}</span>
          </div>
          <ul className="divide-y">
            {filtered.map((r) => (
              <li key={r.user.id}>
                <Link
                  to={`/profile/${r.user.id}`}
                  className={cn(
                    "grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-3 py-2 transition-colors hover:bg-accent/40",
                    rowTint(r.attendedCount),
                  )}
                >
                  <MemberCell row={r} />
                  <AttendedCell count={r.attendedCount} />
                  <TypesCell row={r} />
                  <CityCell city={r.topCity} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function rowTint(count: number): string {
  if (count === 0) return "bg-rose-50 dark:bg-rose-950/30"
  if (count < MONTHLY_THRESHOLD) return "bg-amber-50 dark:bg-amber-950/30"
  return ""
}

function MemberCell({ row }: { row: MonthlyMemberRow }) {
  const Icon = row.attendedCount === 0
    ? CircleX
    : row.attendedCount < MONTHLY_THRESHOLD
      ? AlertTriangle
      : CircleCheck
  const iconCls = row.attendedCount === 0
    ? "text-rose-600"
    : row.attendedCount < MONTHLY_THRESHOLD
      ? "text-amber-600"
      : "text-emerald-600"
  return (
    <div className="flex items-center gap-2 min-w-0">
      <AvatarStack users={[row.user]} max={1} size="md" />
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium truncate">{row.user.first_name ?? "—"}</span>
          <Icon className={cn("h-4 w-4 shrink-0", iconCls)} />
        </div>
        {row.user.username && (
          <div className="text-xs text-muted-foreground truncate">@{row.user.username}</div>
        )}
      </div>
    </div>
  )
}

function AttendedCell({ count }: { count: number }) {
  return <span className="font-semibold tabular-nums text-right w-8">{count}</span>
}

function TypesCell({ row }: { row: MonthlyMemberRow }) {
  if (row.attendedCount === 0) {
    return <span className="text-muted-foreground text-xs">{t.members.monthly.none}</span>
  }
  const s = t.members.monthly.typeShort
  return (
    <span className="text-xs font-mono tabular-nums whitespace-nowrap">
      {s.offline}:{row.byType.offline} {s.online}:{row.byType.online} {s.trip}:{row.byType.trip}
    </span>
  )
}

function CityCell({ city }: { city: string | null }) {
  return (
    <span className="text-xs text-muted-foreground truncate max-w-[8rem]">
      {city ?? t.members.monthly.none}
    </span>
  )
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("uk", { month: "long", year: "numeric" })
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MonthlyMembersTable.tsx
git commit -m "feat(ui): add MonthlyMembersTable with compliance highlighting"
```

---

## Task 9: Add shadcn `Tabs` and wire it into `AdminMembers`

**Files:**
- Create: `src/components/ui/tabs.tsx` (via shadcn CLI)
- Modify: `src/pages/AdminMembers.tsx`

- [ ] **Step 1: Install the shadcn Tabs primitive**

Run: `npx shadcn@latest add tabs --yes`
Expected: creates `src/components/ui/tabs.tsx`. No other files modified except maybe `package.json` if it adds `@radix-ui/react-tabs`.

If `--yes` isn't supported by this shadcn version, run the command without it and accept the default at the prompt. If the command is non-interactive in the dev environment and fails, write the file manually using the standard shadcn Tabs source (see https://ui.shadcn.com/docs/components/tabs — copy the `tabs.tsx` snippet verbatim into `src/components/ui/tabs.tsx`, then `npm install @radix-ui/react-tabs`).

- [ ] **Step 2: Verify Tabs renders in isolation**

Run: `npx tsc -b --noEmit`
Expected: no errors. Tabs component compiles.

- [ ] **Step 3: Rewrite `AdminMembers.tsx` with Tabs**

Replace `src/pages/AdminMembers.tsx` entirely with:

```tsx
// src/pages/AdminMembers.tsx
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, Navigate } from "react-router"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AvatarStack } from "@/components/AvatarStack"
import { MonthlyMembersTable } from "@/components/MonthlyMembersTable"
import { currentUserId } from "@/lib/persona"
import {
  allCommentsQuery,
  allRsvpsQuery,
  eventsQuery,
  meQuery,
  usersQuery,
} from "@/lib/queries"
import { computeAllStats } from "@/lib/userStats"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type SortMode = "activity" | "name" | "recent"

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "activity", label: t.members.sortActivity },
  { value: "name",     label: t.members.sortName },
  { value: "recent",   label: t.members.sortRecent },
]

export function AdminMembers() {
  const { data: me, isLoading: meLoading } = useQuery(meQuery(currentUserId()))
  const { data: users } = useQuery(usersQuery())
  const { data: events } = useQuery(eventsQuery())
  const { data: rsvps } = useQuery(allRsvpsQuery())
  const { data: comments } = useQuery(allCommentsQuery())

  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortMode>("activity")
  const [adminsOnly, setAdminsOnly] = useState(false)

  const allStats = useMemo(() => {
    if (!users || !events || !rsvps || !comments) return []
    return computeAllStats(users, { events, rsvps, comments })
  }, [users, events, rsvps, comments])

  const lifetimeFiltered = useMemo(() => {
    let list = allStats
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.user.first_name?.toLowerCase().includes(q) ||
          s.user.username?.toLowerCase().includes(q),
      )
    }
    if (adminsOnly) list = list.filter((s) => s.user.is_admin)
    const sorted = [...list]
    if (sort === "activity") {
      sorted.sort((a, b) => b.engagementScore - a.engagementScore)
    } else if (sort === "name") {
      sorted.sort((a, b) =>
        (a.user.first_name ?? "").localeCompare(b.user.first_name ?? "", "uk"),
      )
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.user.created_at).getTime() - new Date(a.user.created_at).getTime(),
      )
    }
    return sorted
  }, [allStats, query, adminsOnly, sort])

  if (meLoading) return <p className="text-muted-foreground">{t.common.loading}</p>
  if (!me?.is_admin) return <Navigate to="/" replace />

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {t.members.headingCount(users?.length ?? 0)}
      </h2>

      <Input
        placeholder={t.members.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Tabs defaultValue="lifetime" className="space-y-3">
        <TabsList>
          <TabsTrigger value="lifetime">{t.members.tabs.lifetime}</TabsTrigger>
          <TabsTrigger value="monthly">{t.members.tabs.monthly}</TabsTrigger>
        </TabsList>

        <TabsContent value="lifetime" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t.members.sortLabel}</span>
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={sort === opt.value ? "default" : "outline"}
                size="sm"
                className="h-7 px-3"
                onClick={() => setSort(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={adminsOnly ? "default" : "outline"}
              size="sm"
              className="h-7 px-3 ml-auto"
              onClick={() => setAdminsOnly((v) => !v)}
            >
              {t.members.showAdminsOnly}
            </Button>
          </div>

          {lifetimeFiltered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">{t.members.empty}</p>
          ) : (
            <ul className="space-y-2">
              {lifetimeFiltered.map((s) => (
                <li key={s.user.id}>
                  <Link
                    to={`/profile/${s.user.id}`}
                    className="block rounded-lg border bg-card p-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarStack users={[s.user]} max={1} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {s.user.first_name ?? "—"}
                          </span>
                          {s.user.is_admin && (
                            <Badge variant="secondary" className="h-5 text-[10px]">
                              {t.app.adminBadge}
                            </Badge>
                          )}
                        </div>
                        {s.user.username && (
                          <div className="text-xs text-muted-foreground truncate">
                            @{s.user.username}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {t.members.memberSince(
                            format(new Date(s.user.created_at), "LLLL yyyy", { locale: uk }),
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-x-3 gap-y-0 text-right text-xs shrink-0">
                        <StatMini label={t.members.stats.upcoming} value={s.upcomingCount} accent="emerald" />
                        <StatMini label={t.members.stats.past}     value={s.pastCount}     accent="muted" />
                        <StatMini label={t.members.stats.comments} value={s.commentsCount} accent="sky" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="monthly">
          {users && events && rsvps && comments ? (
            <MonthlyMembersTable
              users={users}
              events={events}
              rsvps={rsvps}
              comments={comments}
              searchQuery={query}
            />
          ) : (
            <p className="text-muted-foreground">{t.common.loading}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatMini({ label, value, accent }: { label: string; value: number; accent: "emerald" | "muted" | "sky" }) {
  const colors: Record<typeof accent, string> = {
    emerald: "text-emerald-600",
    muted:   "text-muted-foreground",
    sky:     "text-sky-600",
  }
  return (
    <div>
      <div className={cn("font-semibold tabular-nums", colors[accent])}>{value}</div>
      <div className="text-muted-foreground text-[10px] leading-tight">{label}</div>
    </div>
  )
}
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/tabs.tsx src/pages/AdminMembers.tsx package.json package-lock.json
git commit -m "feat(admin): tabs wrapper with Lifetime/Monthly views"
```

---

## Task 10: `MemberInsights` component

**Files:**
- Create: `src/components/MemberInsights.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/MemberInsights.tsx
import type { MemberInsights as Insights } from "@/lib/memberInsights"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type Props = { insights: Insights }

export function MemberInsights({ insights }: Props) {
  if (insights.totalAttended === 0) {
    return (
      <section className="space-y-2 border-t pt-4">
        <h2 className="text-base font-semibold">{t.profile.insights.heading}</h2>
        <p className="text-sm text-muted-foreground">{t.profile.insights.empty}</p>
      </section>
    )
  }

  const fire = insights.complianceStreak >= 3 ? ` ${t.profile.insights.streakFire}` : ""

  return (
    <section className="space-y-3 border-t pt-4">
      <h2 className="text-base font-semibold">{t.profile.insights.heading}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <InsightCard
          label={t.profile.insights.totalAttended}
          value={String(insights.totalAttended)}
        />
        <InsightCard
          label={t.profile.insights.attendanceRate}
          value={
            insights.attendanceRate === null
              ? t.profile.insights.attendanceRateUnknown
              : `${Math.round(insights.attendanceRate * 100)}%`
          }
          muted={insights.attendanceRate === null}
        />
        <InsightCard
          label={t.profile.insights.favoriteType}
          value={
            insights.favoriteType
              ? t.profile.insights.favoriteTypeShare(
                  typeLabel(insights.favoriteType.type),
                  insights.favoriteType.pct,
                )
              : "—"
          }
        />
        <InsightCard
          label={t.profile.insights.streakLabel}
          value={`${t.profile.insights.streak(insights.complianceStreak)}${fire}`}
        />
      </div>
      {insights.topCities.length > 0 && (
        <div className="rounded-lg border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
            {t.profile.insights.topCities}
          </div>
          <div className="text-sm">
            {insights.topCities
              .map((c) => `${c.city} (${c.count})`)
              .join(" · ")}
          </div>
        </div>
      )}
    </section>
  )
}

function InsightCard({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className={cn("text-lg font-semibold tabular-nums leading-none", muted && "text-muted-foreground")}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}

function typeLabel(type: "offline" | "online" | "trip"): string {
  return t.members.monthly.typeFull[type]
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/MemberInsights.tsx
git commit -m "feat(ui): add MemberInsights component"
```

---

## Task 11: Wire `MemberInsights` into the Profile page

**Files:**
- Modify: `src/pages/Profile.tsx`

- [ ] **Step 1: Import and render the insights section**

In `src/pages/Profile.tsx`, add the import near the existing component imports:

```tsx
import { MemberInsights } from "@/components/MemberInsights"
import { computeInsights } from "@/lib/memberInsights"
```

Add a `useMemo` for insights next to the existing `stats` memo:

```tsx
const insights = useMemo(() => {
  if (!user || !events || !rsvps || !comments) return null
  return computeInsights(user, { events, rsvps, comments })
}, [user, events, rsvps, comments])
```

Render `<MemberInsights>` immediately after the closing `</header>` tag and before the existing `{stats && (...)}` stat grid:

```tsx
{insights && <MemberInsights insights={insights} />}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Profile.tsx
git commit -m "feat(profile): show MemberInsights at top"
```

---

## Task 12: Add `city` field to `AdminNew`

**Files:**
- Modify: `src/pages/AdminNew.tsx`

- [ ] **Step 1: Extend the zod schema and form defaults**

In `src/pages/AdminNew.tsx`, update the schema to include `city`:

```ts
const schema = z
  .object({
    title: z.string().min(3, t.admin.errors.titleTooShort).max(80),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    city: z.string().max(80).optional(),
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    capacity: z.coerce.number().int().min(1).max(500),
    type: z.enum(["offline", "online", "trip"]),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: t.admin.errors.endBeforeStart,
    path: ["ends_at"],
  })
```

Update `defaultValues` to include `city: ""`.

- [ ] **Step 2: Pass `city` through to the Supabase insert**

In the `create` mutation, add `city: values.city || null` to the `.insert(...)` payload:

```ts
.insert({
  creator_id: userId,
  title: values.title,
  description: values.description || null,
  location: values.location || null,
  city: values.city || null,
  starts_at: new Date(values.starts_at).toISOString(),
  ends_at: new Date(values.ends_at).toISOString(),
  capacity: values.capacity,
  type: values.type,
})
```

- [ ] **Step 3: Add a city input with datalist suggestions**

Insert a new `<Field>` block immediately after the existing location field:

```tsx
<Field label={t.admin.fields.city} error={form.formState.errors.city?.message}>
  <Input
    list="city-suggestions"
    placeholder={t.admin.placeholders.city}
    {...form.register("city")}
  />
  <datalist id="city-suggestions">
    <option value="Мюнхен" />
    <option value="Аугсбург" />
    <option value="Ульм" />
    <option value="Нюрнберг" />
    <option value="Регенсбург" />
    <option value="Інгольштадт" />
    <option value="Штутгарт" />
    <option value="Фрайбург" />
    <option value="Online" />
  </datalist>
</Field>
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx tsc -b --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminNew.tsx
git commit -m "feat(admin): city field with Bavarian suggestions in event form"
```

---

## Task 13: Seed updates — set `city` on inserts, add `attended` flags

**Files:**
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Add `city` to every event insert**

For each of the 11 event inserts in `supabase/seed.sql`, add `city` to the column list and a value to the VALUES clause. Use the mapping below — these are the canonical Bavarian-area cities so the dashboard has good demo data:

| Event id suffix | Existing `location`         | New `city`        |
|-----------------|------------------------------|-------------------|
| 000000001       | Саронічна затока, Греція     | `null` (trip)     |
| 000000002       | Фрайбург                     | `'Фрайбург'`      |
| 000000003       | Online                       | `'Online'`        |
| 000000004       | Штутгарт                     | `'Штутгарт'`      |
| 000000005       | м. Ульм                      | `'Ульм'`          |
| 000000006       | Online                       | `'Online'`        |
| 000000007       | Нюрнберг                     | `'Нюрнберг'`      |
| 000000008       | Фрідріхсхафен                | `'Фрідріхсхафен'` |
| 000000009       | Ендерсбах → Шондорф          | `null`            |
| 00000000a       | Мюнхен                       | `'Мюнхен'`        |
| 00000000b       | Online                       | `'Online'`        |

Concretely, every existing insert that currently reads:

```sql
insert into events (id, creator_id, title, description, location, starts_at, ends_at, type, capacity, image_url) values (
  ...
  'Фрайбург',
  '2026-05-04 17:00:00+02', '2026-05-04 21:00:00+02',
  ...
);
```

becomes:

```sql
insert into events (id, creator_id, title, description, location, city, starts_at, ends_at, type, capacity, image_url) values (
  ...
  'Фрайбург',
  'Фрайбург',
  '2026-05-04 17:00:00+02', '2026-05-04 21:00:00+02',
  ...
);
```

(For inserts with the `speaker_user_id` column, add `city` in the same position — between `location` and `starts_at`.)

- [ ] **Step 2: Add `attended` flags so insights have signal**

After the main RSVP insert block (just before the cancellations), add an update statement that sets `attended` on a sampling of past-event RSVPs. The 5 past events (those with `ends_at <= 2026-05-10`) are: 000000001, 000000002, 000000003, 000000004, 000000005. Append to `supabase/seed.sql`:

```sql
-- Mark attendance on a sampling of past RSVPs so insights have signal.
-- Most past RSVPs stay attended=null (hybrid rule treats them as attended).
-- A small number get explicit yes/no so attendanceRate is non-trivial.
update rsvps set attended = true
where (event_id, user_id) in (
  ('11111111-1111-1111-1111-000000000002', '00000000-0000-0000-0000-000000000010'),
  ('11111111-1111-1111-1111-000000000002', '00000000-0000-0000-0000-000000000012'),
  ('11111111-1111-1111-1111-000000000004', '00000000-0000-0000-0000-000000000010'),
  ('11111111-1111-1111-1111-000000000004', '00000000-0000-0000-0000-000000000012'),
  ('11111111-1111-1111-1111-000000000005', '00000000-0000-0000-0000-000000000011')
);

update rsvps set attended = false
where (event_id, user_id) in (
  ('11111111-1111-1111-1111-000000000003', '00000000-0000-0000-0000-000000000018'),
  ('11111111-1111-1111-1111-000000000004', '00000000-0000-0000-0000-000000000018')
);
```

- [ ] **Step 3: Reset the DB to apply seed**

Run: `npm run db:reset`
Expected: completes without errors. Loud output ends with "Finished supabase db reset".

- [ ] **Step 4: Spot-check the seed**

Run: `npx supabase db query "select id, location, city from events order by starts_at"`
Expected: each row has a `city` value matching the mapping table above (or `null` for the trip and the bike tour).

Run: `npx supabase db query "select event_id, user_id, attended from rsvps where attended is not null order by event_id"`
Expected: returns the 7 explicit attendance rows from Step 2.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(seed): backfill city per event, sample attended flags"
```

---

## Task 14: Manual smoke test in the dev server

This task has no automated tests because all pure-function logic is already covered. The goal is to walk every UI path once and confirm it renders correctly.

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: Vite prints a local URL (e.g. `http://localhost:5173/`). Open it.

- [ ] **Step 2: Type-check and run all unit tests**

Run: `npx tsc -b --noEmit && npm test`
Expected: both succeed. No type errors, all unit tests pass.

- [ ] **Step 3: Verify AdminMembers Lifetime tab**

- Switch persona to the admin (Олександр) via the PersonaPicker.
- Navigate to "Учасники" (`/admin/members` via the existing nav link).
- **Expected:** Tabs row visible with "За весь час" selected. The lifetime list looks exactly as it did before (no regression). Search input above the tabs filters both tabs.

- [ ] **Step 4: Verify AdminMembers Monthly tab**

- Click "По місяцях" tab.
- **Expected:** Month picker shows "травень 2026" (mock today is 2026-05-10). Below-threshold-only toggle visible. Table has rows for every user.
- Members who attended the May past events (000000001 — Greece trip, 000000002 — Фрайбург, 000000003 — Online, 000000004 — Штутгарт, 000000005 — Ульм) have non-zero `attendedCount`.
- Олександр (the admin persona, user_id 0001) has multiple attendances → emerald check + no row tint.
- A persona like Богдан (0017) who only attended Greece (1 event) → amber tint + warning icon.
- A persona with 0 attendances → red tint + X icon.
- Types column shows realistic mix (some Online, some Offline).
- Top city column shows Фрайбург / Штутгарт / Ульм as appropriate.

- [ ] **Step 5: Verify month navigation**

- Click ‹ to go back to "квітень 2026".
- **Expected:** Empty state "У квітні 2026 ще не було подій." (no events seeded outside May).
- Click › twice to go to "червень 2026".
- **Expected:** Same empty state.
- Click ‹ to return to "травень 2026".
- **Expected:** Full table re-renders.

- [ ] **Step 6: Verify filters and sort**

- Toggle "Менше ніж 2" — only red/amber rows remain.
- Sort header "Відвідано ↑" → click to flip to "↓".
- **Expected:** highest-attended members at top.
- Type a name in the search input.
- **Expected:** rows filter live (search applies to both tabs).

- [ ] **Step 7: Verify Profile insights for a high-activity member**

- Click a row that has multiple attendances (e.g., Андрій / 0010).
- **Expected:** `/profile/00000000-0000-0000-0000-000000000010`. "Статистика" section appears at the top with 4 cards (Total / Rate / Favorite type / Streak) and a "Топ міст" row below.
- Attendance rate card shows `100%` (or `50%` if this user has an explicit false), or "Поки що без відміток" if no explicit attended decisions.
- Favorite type shows "Офлайн · NN%" or similar.

- [ ] **Step 8: Verify Profile insights for a zero-activity member**

- Navigate to a member with no past RSVPs (some shadow users have only future RSVPs).
- **Expected:** Insights section renders the single muted line "Поки що без активності".

- [ ] **Step 9: Verify AdminNew city field**

- Click "+ Нова подія".
- **Expected:** New "Місто" field below "Місце" with placeholder "Мюнхен, Ульм, Online…".
- Focus the field — datalist suggestions drop down with the 8 Bavarian cities + Online.
- Submit a new event with city = "Аугсбург".
- **Expected:** Toast "Подію створено". Navigate to the event detail. The event appears in the calendar.
- Re-open AdminMembers → Monthly tab. The new event is included if you RSVP to it as a past event (or if it's in May 2026 and within the current month).

- [ ] **Step 10: Final commit (only if there are any leftover unstaged changes)**

Run: `git status`
Expected: clean working tree. If anything's unstaged from the smoke test (e.g., a test event was added through the DB), decide whether it belongs in the seed; otherwise reset.

```bash
git status                # confirm clean
```

---

## Self-Review (notes)

- **Spec coverage:** all 8 decisions and all 5 insights are implemented:
  - D1 hybrid attendance → Task 3
  - D2 Tabs inside AdminMembers → Task 9
  - D3 city column + AdminNew + datalist → Tasks 1, 12, 13
  - D4 monthly table columns + tint → Task 8
  - D5 insights on Profile + dashboard linking → Tasks 10, 11
  - D6 specific insights set → Task 5
  - D7 Bavarian geography → Tasks 1, 12, 13
  - D8 client-side compute → Tasks 3, 4, 5

- **Placeholder scan:** no TBDs, no "implement later", no test stubs without code.

- **Type consistency:** `StatsContext` is defined in `monthlyStats.ts` and re-exported / imported in `memberInsights.ts`. `MonthlyMemberRow` and `MemberInsights` types are referenced consistently. `MONTHLY_THRESHOLD = 2` is the only constant.

- **Notable simplification vs. spec:** the spec mentions optional component smoke tests for `MonthlyMembersTable`. Since the project uses `environment: "node"` in vitest with no JSDOM, this plan keeps the pure-function tests and verifies UI via the manual smoke pass in Task 14. This matches the existing convention (no React component tests in the repo today).
