# Admin Dashboard — Monthly Attendance & Member Insights

**Date:** 2026-05-23
**Status:** Design approved, awaiting implementation plan
**Mode:** Local demo only (mock data, no VPS / no production push)

## Problem

Admins need to see member activity at a glance and identify members who fall below the community's engagement threshold of **2 events per month**. Today, `/admin/members` shows lifetime stats only — there's no way to ask "who needs a nudge this month?" or "which event types/cities does a particular member prefer?".

## Goals

1. **Monthly compliance view** — table of all members with this-month attendance counts, visually flagging those below the 2-event threshold.
2. **Per-user lifetime insights** — favorite event type, top cities, attendance rate, total events, and current compliance streak.
3. **Reuse the existing AdminMembers page** — add a Lifetime/Monthly tab; don't fork the navigation.
4. **Stay in mock mode** — no deployment, no schema changes that would require running migrations against a remote DB.

## Non-Goals

- CSV export of the monthly table.
- Year picker or full month-grid date selection (arrows only).
- Multi-month comparison view.
- Automated notifications to below-threshold members.
- Real authentication or role enforcement beyond the existing `is_admin` check.

## Decisions (from brainstorming)

| # | Question | Decision |
|---|----------|----------|
| 1 | What counts as "attended"? | **Hybrid**: prefer `rsvps.attended` when set; for `null`, treat `status='going'` + past event as attended. |
| 2 | Where does the dashboard live? | **Tabs inside `/admin/members`** — "Lifetime" (existing) and "Monthly" (new). |
| 3 | How are cities represented? | **Add `city` column to `events`** (nullable text). Migrate seed by backfilling from `location`. Free-text input with autocomplete suggestions in `AdminNew`. |
| 4 | Monthly table columns | Name · Attended count · Per-type counts (offline/online/trip) · Top city this month. Below-threshold rows tinted. |
| 5 | Where do per-user insights live? | **Profile page** (`/profile/:userId`) — new "Insights" section at the top. Dashboard rows link to Profile. |
| 6 | Which insights | Total attended, favorite type (with %), top 3 cities, attendance rate, compliance streak. |
| 7 | Geography | Community is in **southern Germany** (Munich area). City suggestions: Мюнхен, Аугсбург, Ульм, Нюрнберг, Регенсбург, Інгольштадт, Штутгарт, Фрайбург, Online. Match the Cyrillic transliteration already used in the existing seed. |
| 8 | Compute approach | **Client-side** in `userStats.ts` — reuses existing `usersQuery / eventsQuery / allRsvpsQuery / allCommentsQuery`. No new fetches, no SQL views. |

## Architecture

```
src/lib/
  attendance.ts                 ← NEW: resolveAttended(rsvp, event, now) — the hybrid rule
  userStats.ts                  ← extended with computeMonthly, computeInsights

src/components/
  MonthlyMembersTable.tsx       ← NEW: month-scoped member table + month picker + filters
  MonthPicker.tsx               ← NEW: ‹ May 2026 › arrow stepper
  MemberInsights.tsx            ← NEW: insights block (used on Profile)

src/pages/
  AdminMembers.tsx              ← wraps existing list in shadcn Tabs (Lifetime | Monthly)
  Profile.tsx                   ← gains an "Insights" section above the existing stat cards
  AdminNew.tsx                  ← adds a city input with datalist suggestions

src/lib/strings.ts              ← new keys under t.members.monthly.* and t.profile.insights.*

supabase/
  migrations/0005_event_city.sql ← NEW: adds events.city (nullable text), backfills from location
  seed.sql                       ← extended: city set on new and existing event inserts
```

### Module boundaries

- `attendance.ts` owns the single rule "what counts as attended" — exported from one place; every caller imports it. Single source of truth.
- `userStats.ts` is pure (no React, no Supabase) — all functions unit-testable in isolation.
- `MonthlyMembersTable` and `MemberInsights` are presentational; they receive the output of `computeMonthly` / `computeInsights` as props.

## Data Shapes

### `src/lib/attendance.ts`

```ts
export function resolveAttended(
  rsvp: RsvpRow,
  event: EventRow,
  now: Date = new Date(),
): boolean {
  if (rsvp.attended !== null) return rsvp.attended          // admin marked it
  if (rsvp.status !== "going") return false                 // cancelled
  return new Date(event.ends_at) <= now                     // past + going = attended
}
```

### `src/lib/userStats.ts` (additions)

```ts
export const MONTHLY_THRESHOLD = 2

export type MonthlyMemberRow = {
  user: UserRow
  attendedCount: number
  byType: { offline: number; online: number; trip: number }
  topCity: string | null            // null if attendedCount === 0 or all events had null city
  meetsThreshold: boolean           // attendedCount >= MONTHLY_THRESHOLD
}

export function computeMonthly(
  users: UserRow[],
  ctx: StatsContext,
  range: { start: Date; end: Date },   // [start, end)
): MonthlyMemberRow[]

export type MemberInsights = {
  totalAttended: number
  favoriteType: { type: EventType; count: number; pct: number } | null
  topCities: { city: string; count: number }[]        // up to 3
  attendanceRate: number | null                       // attended / (attended + no-shows), 0..1
  complianceStreak: number                            // consecutive months with >= 2 attended
}

export function computeInsights(
  user: UserRow,
  ctx: StatsContext,
  now: Date = new Date(),
): MemberInsights
```

### Compute rules

- **Month range** of an event = the month containing its `ends_at` (matters for multi-day trips).
- **Top city** in `MonthlyMemberRow`: among attended events in the range, group by `city`, pick the highest count; ties broken alphabetically (case-insensitive, locale `uk`). Events with `city === null` are excluded from the grouping but still count toward `attendedCount` and `byType`.
- **`attendanceRate`** denominator = number of past events the user RSVP'd `going` for *and* where an admin explicitly set `attended` (true or false). Past events with `attended === null` are excluded from the denominator. Returns `null` when the denominator is 0.
- **`complianceStreak`**: walk backward month-by-month from the current month. The current month counts only if it already has ≥ 2 attended; otherwise start from the previous month. Stop at the first month with < 2. Months that had zero events in the entire community do NOT break the chain (skip them and continue counting).
- **`favoriteType`**: pick the type with the highest attended count across all time; ties broken by enum order `offline > online > trip`. `pct` rounded to nearest integer. Returns `null` when `totalAttended === 0`.
- **`topCities`**: same grouping as monthly top city but lifetime; return up to 3 sorted by count desc, alphabetical tiebreak.

## UI

### AdminMembers — Tabs

```
Members (42)
[ Lifetime ] [ Monthly ]
```

- shadcn `<Tabs>` controlling which view renders below.
- Default tab: Lifetime (preserves current behavior on revisit).
- Search input and sort buttons stay above the tabs and apply to whichever tab is active (search is by name/username; sort options differ per tab).

### Monthly tab

```
[ ‹ ]  May 2026  [ › ]      [ Below threshold only □ ]
┌──────────────────────────────────────────────────────┐
│ Member         Attended ↑  Types          Top city  │
├──────────────────────────────────────────────────────┤
│ 👤 Olena ⚠️    1           O:1 ⊘:0 ✈:0    Ульм     │  amber tint
│ 👤 Pavlo ❌    0           —              —          │  red tint
│ 👤 Iryna ✅    3           O:2 ⊘:1 ✈:0    Штутгарт │
│ 👤 Yuri  ✅    5           O:3 ⊘:0 ✈:2    Мюнхен   │
└──────────────────────────────────────────────────────┘
```

- **Row tint:** `bg-rose-50` (red) for 0, `bg-amber-50` (amber) for 1, none for ≥ 2. Dark mode equivalents.
- **Status icon** (Lucide): `CircleX` (red), `AlertTriangle` (amber), `CircleCheck` (emerald).
- **Sort:** clicking "Attended" header toggles asc/desc. Default ascending so worst offenders appear first.
- **Types column:** compact inline `O:n ⊘:n ✈:n` with tooltip giving the full word.
- **Top city:** single city, `—` when none.
- **Row click:** navigates to `/profile/:userId`.
- **Below-threshold filter:** toggle showing only rows where `meetsThreshold === false`.
- **Empty states:**
  - No members at all → "No members yet."
  - All filtered out → "No members match the current filters."
  - Selected month has no events in the entire DB → "No events in {month} yet — nothing to score."

### MonthPicker

- ‹ / › arrows step by one month.
- Defaults to current month on mount.
- Center label is the formatted month/year ("May 2026" or localized "Травень 2026"). Clickable shape but no-op for now (future: open a grid).
- No bound on how far back you can step; future is allowed but mostly useless until events exist.

### Profile — Insights section

```
Insights
┌─────────────────────────┬─────────────────────────┐
│ Total events attended   │ Attendance rate         │
│   12                    │   92%  (11/12)          │
├─────────────────────────┼─────────────────────────┤
│ Favorite type           │ Compliance streak       │
│   Offline · 67%         │   4 months 🔥           │
├─────────────────────────┼─────────────────────────┤
│ Top cities                                        │
│   Мюнхен (8) · Ульм (3) · Аугсбург (1)            │
└───────────────────────────────────────────────────┘
```

- 4-up grid on `sm:` and above; stacks 2-up on mobile.
- 🔥 emoji appears only when `complianceStreak >= 3`.
- When `totalAttended === 0`: entire section renders a single muted "No activity yet" line instead of empty cards.
- When `attendanceRate === null`: shows `—` and tooltip "No attendance check-ins yet".

### AdminNew — city input

- New `<Input>` with `list="city-suggestions"` and a colocated `<datalist>` containing the 8 Bavarian suggestions + "Online".
- Optional field. Trips can leave it blank.
- Placed below the existing location field (location stays as the human-readable venue; city is the aggregation bucket).

## Migration & Seed

### `supabase/migrations/0005_event_city.sql`

```sql
alter table events add column city text;

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
  when type = 'trip'                    then null
  else null
end;
```

### `supabase/seed.sql`

- Update every existing event insert to include `city`. Spread the events across the 8 suggested cities so the dashboard has realistic data to display.
- Add `attended` flags on a sampling of past RSVPs (some true, some false, most null) so the `attendanceRate` calculation has signal.

## Testing

```
tests/lib/attendance.test.ts            ← resolveAttended truth table
tests/lib/userStats.monthly.test.ts     ← computeMonthly: range, byType, topCity, threshold
tests/lib/userStats.insights.test.ts    ← computeInsights: empty, pct, streak, rate, topCities
tests/components/MonthlyMembersTable.test.tsx  ← smoke: renders rows; filter toggle; sort
```

### Truth table for `resolveAttended`

| `attended` | `status`    | event in past | result |
|------------|-------------|---------------|--------|
| `true`     | any         | any           | `true`  |
| `false`    | any         | any           | `false` |
| `null`     | `cancelled` | any           | `false` |
| `null`     | `going`     | yes           | `true`  |
| `null`     | `going`     | no            | `false` |

### Key insight tests

- **Streak with empty month:** user attended ≥ 2 in Mar and May, but the community held 0 events in April. Expected streak (asking in May): 3.
- **Streak with bad month:** user attended ≥ 2 in Mar and May, but only 1 in April (which had events). Expected streak (asking in May): 1.
- **AttendanceRate denominator:** user has 3 past RSVPs `going` — two with `attended=true`, one with `attended=null`. Expected rate: `2 / 2 = 100%`. The `null` row is excluded from the denominator.
- **TopCity tie:** user attended 2 events in Ульм and 2 in Штутгарт this month. Expected `topCity`: `"Ульм"` (in the Ukrainian alphabet У precedes Ш, so Ульм wins the alphabetical tiebreak). Test pins exact ordering with `localeCompare("uk")`.

## Edge Cases

- **Trips spanning months:** counted in the month containing `ends_at`. Documented in `userStats.ts` near `computeMonthly`.
- **Events with `city === null`:** counted in `attendedCount` and `byType` but excluded from city aggregations.
- **Demoted admin:** if a viewer loses `is_admin` while on the dashboard, the existing `<Navigate to="/" replace />` guard already handles it.
- **Self-view on Profile:** Insights show for the viewer too; same compute, no special-casing.
- **0-event months:** monthly table renders empty-state message; streak calculation skips them.

## Out of Scope (deferred)

- Configurable threshold (hardcoded constant for now; one line to change).
- City normalization fuzzy matching (e.g. "м. Ульм" vs "Ульм") — handled once in the seed migration, going forward the form's datalist keeps values consistent.
- Server-side aggregation / Postgres views — would only matter past a few thousand events.
- Push or Telegram notification to below-threshold members.
- Per-tag (not type) insights — only event `type` is used; `tags` field is out of scope here.

## Implementation Order (rough)

1. Migration `0005_event_city.sql` + seed updates.
2. `attendance.ts` + its tests.
3. `userStats.ts` extensions + tests.
4. `MonthPicker` + `MonthlyMembersTable` components.
5. `AdminMembers` Tabs wrapper.
6. `MemberInsights` component + Profile integration.
7. `AdminNew` city input + datalist.
8. String additions to `strings.ts`.

(Final ordering and task decomposition will come from the writing-plans skill.)
