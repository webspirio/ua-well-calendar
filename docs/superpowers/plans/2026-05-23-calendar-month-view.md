# Calendar Month View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the list at `/` with a month-calendar primary surface that highlights days with events (type-colored dots), opens a modal listing that day's events on tap, and keeps a month-synced strip below. Mobile-first (Telegram Mini App).

**Architecture:** shadcn `calendar` (react-day-picker v9) with a custom `DayButton` render slot for dots; shadcn `dialog` for the day modal; shadcn `switch` for the "Mine only" toggle. State (`month`, `selectedDay`, `mineOnly`, `type`) is lifted into `EventList.tsx` and feeds both the calendar and the strip. Data flows through the existing in-memory mock supabase client — no DB calls, no migrations.

**Tech Stack:** React 19, TypeScript, Vite, TanStack Query, shadcn (base-nova), Tailwind v4, date-fns 4 (`uk` locale), react-day-picker v9 (via shadcn calendar), Vitest.

**Spec:** `docs/superpowers/specs/2026-05-23-calendar-month-view-design.md`

---

## Task 1: Install shadcn primitives (calendar, dialog, switch)

**Files:**
- Create: `src/components/ui/calendar.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/switch.tsx`
- Modify (auto): `package.json`, `package-lock.json` (new deps `react-day-picker`, `@radix-ui/react-dialog`, `@radix-ui/react-switch`)

- [ ] **Step 1: Install the three shadcn primitives**

Run from repo root:

```bash
npx shadcn@latest add calendar dialog switch
```

When prompted, accept the default install paths. The CLI writes the three files into `src/components/ui/` and patches `package.json` with the runtime deps.

- [ ] **Step 2: Verify the install**

```bash
ls src/components/ui/calendar.tsx src/components/ui/dialog.tsx src/components/ui/switch.tsx
grep -E '"(react-day-picker|@radix-ui/react-dialog|@radix-ui/react-switch)"' package.json
npm run build
```

Expected: three files exist, three deps appear in `package.json`, build passes (TS compile + Vite build).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/calendar.tsx src/components/ui/dialog.tsx src/components/ui/switch.tsx package.json package-lock.json
git commit -m "chore: add shadcn calendar/dialog/switch primitives"
```

---

## Task 2: Add calendar helpers to `src/lib/dates.ts` (TDD)

**Files:**
- Modify: `src/lib/dates.ts` (add `eventsOnDay`, `eventsInMonth`, `eventTypesOnDay`)
- Create: `tests/calendar_helpers.test.ts`

The helpers operate on `EventRow[]` from `src/lib/queries.ts`. All comparisons must be overlap-based, not equality-based, so multi-day events appear on every spanned day.

- [ ] **Step 1: Write the failing tests**

Create `tests/calendar_helpers.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { eventsOnDay, eventsInMonth, eventTypesOnDay } from "@/lib/dates"
import type { EventRow } from "@/lib/queries"

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

describe("eventsOnDay(events, day)", () => {
  const single = ev("single", "2026-05-11T18:00:00+02:00", "2026-05-11T20:00:00+02:00")
  const multi = ev("multi", "2026-05-02T12:00:00+02:00", "2026-05-09T18:00:00+02:00", "trip")

  it("returns same-day events", () => {
    const day = new Date("2026-05-11T00:00:00+02:00")
    expect(eventsOnDay([single, multi], day).map((e) => e.id)).toEqual(["single"])
  })

  it("returns a multi-day event for every spanned day (start, middle, end)", () => {
    expect(eventsOnDay([multi], new Date("2026-05-02T00:00:00+02:00")).map((e) => e.id)).toEqual(["multi"])
    expect(eventsOnDay([multi], new Date("2026-05-05T00:00:00+02:00")).map((e) => e.id)).toEqual(["multi"])
    expect(eventsOnDay([multi], new Date("2026-05-09T00:00:00+02:00")).map((e) => e.id)).toEqual(["multi"])
  })

  it("excludes days outside the event's range", () => {
    expect(eventsOnDay([multi], new Date("2026-05-01T00:00:00+02:00"))).toEqual([])
    expect(eventsOnDay([multi], new Date("2026-05-10T00:00:00+02:00"))).toEqual([])
  })

  it("treats an event ending at midnight as belonging to the previous day, not the next", () => {
    // 18:00 → 24:00 on May 11. Day pointer is May 12 (midnight start).
    const endsAtMidnight = ev(
      "ends-midnight",
      "2026-05-11T18:00:00+02:00",
      "2026-05-12T00:00:00+02:00",
    )
    expect(eventsOnDay([endsAtMidnight], new Date("2026-05-11T00:00:00+02:00")).map((e) => e.id)).toEqual(["ends-midnight"])
    expect(eventsOnDay([endsAtMidnight], new Date("2026-05-12T00:00:00+02:00"))).toEqual([])
  })
})

describe("eventsInMonth(events, monthDate)", () => {
  const may = ev("may", "2026-05-11T18:00:00+02:00", "2026-05-11T20:00:00+02:00")
  const aprMayBoundary = ev("apr-may", "2026-04-30T20:00:00+02:00", "2026-05-01T02:00:00+02:00", "trip")
  const mayJunBoundary = ev("may-jun", "2026-05-31T20:00:00+02:00", "2026-06-01T02:00:00+02:00", "trip")
  const june = ev("june", "2026-06-15T18:00:00+02:00", "2026-06-15T20:00:00+02:00")

  it("returns events whose range overlaps the month, ordered by starts_at", () => {
    const result = eventsInMonth([june, may, mayJunBoundary, aprMayBoundary], new Date("2026-05-15T12:00:00+02:00"))
    expect(result.map((e) => e.id)).toEqual(["apr-may", "may", "may-jun"])
  })

  it("includes a boundary event in both months", () => {
    expect(eventsInMonth([mayJunBoundary], new Date("2026-05-15T12:00:00+02:00")).map((e) => e.id)).toEqual(["may-jun"])
    expect(eventsInMonth([mayJunBoundary], new Date("2026-06-15T12:00:00+02:00")).map((e) => e.id)).toEqual(["may-jun"])
  })

  it("returns empty when no events touch the month", () => {
    expect(eventsInMonth([may], new Date("2026-01-15T12:00:00+02:00"))).toEqual([])
  })
})

describe("eventTypesOnDay(events, day)", () => {
  it("returns a deduped set of types present on the day", () => {
    const day = new Date("2026-05-11T00:00:00+02:00")
    const a = ev("a", "2026-05-11T10:00:00+02:00", "2026-05-11T11:00:00+02:00", "online")
    const b = ev("b", "2026-05-11T14:00:00+02:00", "2026-05-11T15:00:00+02:00", "online")
    const c = ev("c", "2026-05-11T18:00:00+02:00", "2026-05-11T19:00:00+02:00", "offline")
    const result = eventTypesOnDay([a, b, c], day)
    expect(result.size).toBe(2)
    expect(result.has("online")).toBe(true)
    expect(result.has("offline")).toBe(true)
  })

  it("is empty when no events touch the day", () => {
    expect(eventTypesOnDay([], new Date("2026-05-11T00:00:00+02:00")).size).toBe(0)
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
npm test -- tests/calendar_helpers.test.ts
```

Expected: all three describe blocks fail because the imports `eventsOnDay`, `eventsInMonth`, `eventTypesOnDay` are not exported from `@/lib/dates`.

- [ ] **Step 3: Implement the helpers**

Append to `src/lib/dates.ts` (after the existing exports):

```ts
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import type { EventRow } from "./queries"

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() <= bEnd.getTime() && aEnd.getTime() >= bStart.getTime()
}

export function eventsOnDay(events: EventRow[], day: Date): EventRow[] {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  return events.filter((ev) => {
    const evStart = new Date(ev.starts_at)
    const evEnd = new Date(ev.ends_at)
    // Treat an event ending exactly at 00:00 as belonging to the previous day,
    // not the next: require strict > comparison on the end vs day-start.
    return evStart.getTime() <= dayEnd.getTime() && evEnd.getTime() > dayStart.getTime()
  })
}

export function eventsInMonth(events: EventRow[], monthDate: Date): EventRow[] {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  return events
    .filter((ev) =>
      rangesOverlap(new Date(ev.starts_at), new Date(ev.ends_at), monthStart, monthEnd),
    )
    .sort(
      (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )
}

export function eventTypesOnDay(events: EventRow[], day: Date): Set<EventRow["type"]> {
  const set = new Set<EventRow["type"]>()
  for (const ev of eventsOnDay(events, day)) set.add(ev.type)
  return set
}
```

Also add the `import` for `startOfDay`/`endOfDay`/`startOfMonth`/`endOfMonth` and `EventRow` at the top of the file. The existing `import { format, isSameDay, ... } from "date-fns"` line should be extended; do not add a second `from "date-fns"` import.

The final import block at the top of `src/lib/dates.ts` should read:

```ts
import {
  format,
  isSameDay,
  isSameMonth,
  differenceInCalendarDays,
  differenceInMinutes,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import { uk } from "date-fns/locale"
import type { EventRow } from "./queries"
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
npm test -- tests/calendar_helpers.test.ts
```

Expected: all tests green.

- [ ] **Step 5: Run the full test suite to confirm no regressions**

```bash
npm test
```

Expected: all tests green (the existing `tests/quick_wins.test.ts` continues to pass).

- [ ] **Step 6: Commit**

```bash
git add src/lib/dates.ts tests/calendar_helpers.test.ts
git commit -m "feat(dates): eventsOnDay/eventsInMonth/eventTypesOnDay helpers"
```

---

## Task 3: Add Ukrainian strings for the calendar UI

**Files:**
- Modify: `src/lib/strings.ts`

- [ ] **Step 1: Add a `calendar` block to the `t` object**

In `src/lib/strings.ts`, add a new top-level key `calendar` to the `t` object, just before the existing `types` key. Inserted exactly:

```ts
  calendar: {
    mineToggle: "★ Тільки мої",
    modalEmpty: "На цей день подій немає.",
    monthEmpty: "У цьому місяці подій немає.",
    legend: {
      offline: "Офлайн",
      online: "Онлайн",
      trip: "Подорож",
    },
  },
```

The key sits between the existing `profile: { ... },` block and the existing `types: { ... },` block. Do not modify other keys.

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
npm run build
```

Expected: no errors. (`strings.ts` is `as const`, so the new keys are typed automatically.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/strings.ts
git commit -m "feat(strings): add Ukrainian copy for calendar view"
```

---

## Task 4: Build the `MineToggle` component

**Files:**
- Create: `src/components/MineToggle.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/MineToggle.tsx`:

```tsx
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { t } from "@/lib/strings"

type Props = {
  value: boolean
  onChange: (v: boolean) => void
}

export function MineToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Label htmlFor="mine-toggle" className="text-sm text-muted-foreground">
        {t.calendar.mineToggle}
      </Label>
      <Switch
        id="mine-toggle"
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: no errors. The component is unused so far but must compile.

- [ ] **Step 3: Commit**

```bash
git add src/components/MineToggle.tsx
git commit -m "feat(ui): MineToggle switch component"
```

---

## Task 5: Build the `EventCalendar` component

**Files:**
- Create: `src/components/EventCalendar.tsx`

This component wraps the shadcn `Calendar` and overrides the `DayButton` render slot to draw type-colored dots under the date number.

- [ ] **Step 1: Inspect the shadcn calendar slot API**

Run:

```bash
grep -nE "DayButton|components\?:" src/components/ui/calendar.tsx | head -20
```

Read the file if needed. The shadcn-generated `Calendar` accepts react-day-picker v9 props. The slot we'll override is `components.DayButton` — react-day-picker v9 passes `day: CalendarDay` (with `day.date: Date`) and the standard button props.

- [ ] **Step 2: Write the component**

Create `src/components/EventCalendar.tsx`:

```tsx
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { EventType } from "@/lib/queries"

type Props = {
  month: Date
  selectedDay: Date | null
  daysWithEvents: Map<string, Set<EventType>>
  onMonthChange: (d: Date) => void
  onDayPick: (d: Date) => void
}

const DOT_CLASS: Record<EventType, string> = {
  offline: "bg-orange-500",
  online: "bg-emerald-500",
  trip: "bg-sky-500",
}

const DOT_ORDER: EventType[] = ["offline", "online", "trip"]

export function EventCalendar({
  month,
  selectedDay,
  daysWithEvents,
  onMonthChange,
  onDayPick,
}: Props) {
  return (
    <Calendar
      mode="single"
      locale={uk}
      weekStartsOn={1}
      month={month}
      onMonthChange={onMonthChange}
      selected={selectedDay ?? undefined}
      onSelect={(d) => {
        if (d) onDayPick(d)
      }}
      showOutsideDays
      className="mx-auto w-full max-w-sm"
      components={{
        DayButton: ({ day, modifiers, className, ...props }) => {
          const key = format(day.date, "yyyy-MM-dd")
          const types = daysWithEvents.get(key)
          return (
            <button
              {...props}
              className={cn(
                "relative flex h-9 w-9 flex-col items-center justify-center rounded-md p-0 text-sm",
                "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary",
                modifiers.today && !modifiers.selected && "bg-accent text-accent-foreground",
                modifiers.outside && "text-muted-foreground/50",
                className,
              )}
            >
              <span className="leading-none">{day.date.getDate()}</span>
              {types && types.size > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {DOT_ORDER.filter((t) => types.has(t)).map((t) => (
                    <span
                      key={t}
                      className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[t])}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        },
      }}
    />
  )
}
```

Notes for the implementer:
- The shadcn-generated `calendar.tsx` already imports react-day-picker v9 and wires up locale + nav. Our override only customizes the day cell.
- `day.date` is the calendar day (always defined for `DayButton`). `modifiers` carries `selected`, `today`, `outside`, etc.
- If the shadcn template differs (newer style without `modifiers` in `DayButton` props), inspect the generated file and adapt — but keep the same visual structure (date number on top, dot row anchored at `bottom-1`).

- [ ] **Step 3: Verify the build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventCalendar.tsx
git commit -m "feat(ui): EventCalendar with type-colored dots"
```

---

## Task 6: Build the `DayEventsDialog` component

**Files:**
- Create: `src/components/DayEventsDialog.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/DayEventsDialog.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { allRsvpsQuery, type EventRow } from "@/lib/queries"
import { formatEventWhen, isPast } from "@/lib/dates"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type Props = {
  day: Date | null
  events: EventRow[]
  onOpenChange: (open: boolean) => void
}

export function DayEventsDialog({ day, events, onOpenChange }: Props) {
  const { data: rsvps } = useQuery(allRsvpsQuery())
  const open = day !== null && events.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {day ? format(day, "EEEE, d MMMM", { locale: uk }) : ""}
          </DialogTitle>
        </DialogHeader>
        <ul className="overflow-y-auto space-y-2 -mx-1 px-1">
          {events.map((ev) => {
            const going = rsvps
              ? rsvps.filter((r) => r.event_id === ev.id && r.status === "going").length
              : 0
            const past = isPast(ev.ends_at)
            const typeMeta = t.types[ev.type]
            return (
              <li key={ev.id}>
                <Link
                  to={`/event/${ev.id}`}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "block rounded-lg border bg-card p-3 hover:bg-accent transition",
                    past && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{typeMeta.emoji}</span>
                        <span>{typeMeta.label}</span>
                      </div>
                      <h4 className="font-medium text-sm leading-tight mt-0.5 line-clamp-2">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatEventWhen(ev.starts_at, ev.ends_at)}
                      </p>
                      {ev.location && (
                        <p className="text-xs text-muted-foreground truncate">
                          {ev.location}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {t.list.goingCount(going, ev.capacity)}
                    </Badge>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/DayEventsDialog.tsx
git commit -m "feat(ui): DayEventsDialog modal for date selection"
```

---

## Task 7: Strip the time-filter from `EventFilters`

**Files:**
- Modify: `src/components/EventFilters.tsx`

The calendar now drives "which events to look at" via the visible month and the Mine toggle. The time filter (Upcoming / Past / Mine / All) goes away. The type filter stays.

- [ ] **Step 1: Rewrite `EventFilters.tsx`**

Replace the entire file with:

```tsx
import { Button } from "@/components/ui/button"
import { t } from "@/lib/strings"
import type { EventType } from "@/lib/queries"

export type TypeFilter = "all" | EventType

type Props = {
  type: TypeFilter
  onTypeChange: (v: TypeFilter) => void
}

export function EventFilters({ type, onTypeChange }: Props) {
  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "all",     label: t.filters.typeAll },
    { value: "offline", label: t.admin.types.offline },
    { value: "online",  label: t.admin.types.online },
    { value: "trip",    label: t.admin.types.trip },
  ]

  return (
    <div className="flex flex-wrap gap-1.5">
      {typeOptions.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={type === opt.value ? "default" : "outline"}
          size="sm"
          className="h-7 px-3"
          onClick={() => onTypeChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}
```

This drops the `TimeFilter` type export and the sticky-bar container (the calendar wrapper above will handle layout). The exported `EventFilters` props are now `{ type, onTypeChange }`.

- [ ] **Step 2: Verify the build (will fail because EventList still imports TimeFilter)**

```bash
npm run build
```

Expected: TypeScript error in `src/pages/EventList.tsx` — `TimeFilter` no longer exported, props mismatch. That's fine and gets fixed in Task 8.

- [ ] **Step 3: Commit (work in progress)**

```bash
git add src/components/EventFilters.tsx
git commit -m "refactor(ui): drop time filter from EventFilters"
```

---

## Task 8: Wire calendar + dialog into `EventList.tsx`

**Files:**
- Modify: `src/pages/EventList.tsx` (full rewrite — easiest to overwrite)

- [ ] **Step 1: Rewrite `EventList.tsx`**

Replace the entire contents of `src/pages/EventList.tsx` with:

```tsx
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { format } from "date-fns"
import { buttonVariants } from "@/components/ui/button"
import { EventCard } from "@/components/EventCard"
import { EventCardSkeleton } from "@/components/EventCardSkeleton"
import { EventCalendar } from "@/components/EventCalendar"
import { DayEventsDialog } from "@/components/DayEventsDialog"
import { MineToggle } from "@/components/MineToggle"
import { EventFilters, type TypeFilter } from "@/components/EventFilters"
import { NextUpHero } from "@/components/NextUpHero"
import { currentUserId } from "@/lib/persona"
import { allRsvpsQuery, eventsQuery, meQuery, type EventType } from "@/lib/queries"
import { filterMine } from "@/lib/eventBadges"
import {
  eventsInMonth,
  eventsOnDay,
  eventTypesOnDay,
  now,
} from "@/lib/dates"
import { t } from "@/lib/strings"

export function EventList() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  const { data: events, isLoading, error } = useQuery(eventsQuery())
  const { data: allRsvps } = useQuery(allRsvpsQuery())

  const [month, setMonth] = useState<Date>(now())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [mineOnly, setMineOnly] = useState(false)
  const [type, setType] = useState<TypeFilter>("all")

  const visibleEvents = useMemo(() => {
    if (!events) return []
    let base = events
    if (mineOnly && me) base = filterMine(events, allRsvps ?? [], me.id)
    if (type !== "all") base = base.filter((ev) => ev.type === type)
    return base
  }, [events, mineOnly, type, allRsvps, me])

  const monthEvents = useMemo(
    () => eventsInMonth(visibleEvents, month),
    [visibleEvents, month],
  )

  const dayEvents = useMemo(
    () => (selectedDay ? eventsOnDay(visibleEvents, selectedDay) : []),
    [visibleEvents, selectedDay],
  )

  const daysWithEvents = useMemo(() => {
    const map = new Map<string, Set<EventType>>()
    for (const ev of monthEvents) {
      const start = new Date(ev.starts_at)
      const end = new Date(ev.ends_at)
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const stopMs = end.getTime()
      while (cursor.getTime() <= stopMs) {
        const types = eventTypesOnDay(visibleEvents, cursor)
        if (types.size > 0) {
          map.set(format(cursor, "yyyy-MM-dd"), types)
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [monthEvents, visibleEvents])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <EventCardSkeleton />
      </div>
    )
  }
  if (error) return <p className="text-muted-foreground">{t.common.error}</p>
  if (!events?.length) return <p className="text-muted-foreground">{t.list.empty}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t.list.heading}</h2>
        {me?.is_admin && (
          <Link to="/admin/new" className={buttonVariants()}>
            {t.list.newEvent}
          </Link>
        )}
      </div>

      {!mineOnly && <NextUpHero events={events} />}

      <MineToggle value={mineOnly} onChange={setMineOnly} />

      <EventCalendar
        month={month}
        selectedDay={selectedDay}
        daysWithEvents={daysWithEvents}
        onMonthChange={setMonth}
        onDayPick={setSelectedDay}
      />

      <EventFilters type={type} onTypeChange={setType} />

      {monthEvents.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {mineOnly ? t.list.emptyMine : t.calendar.monthEmpty}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {monthEvents.map((ev) => (
            <li key={ev.id} className="h-full">
              <Link to={`/event/${ev.id}`} className="block h-full">
                <EventCard event={ev} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <DayEventsDialog
        day={selectedDay}
        events={dayEvents}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null)
        }}
      />
    </div>
  )
}
```

Why the loops in `daysWithEvents`:
- For each event in the month, we walk its spanned days and ask `eventTypesOnDay` what types touch that calendar day in the *visible* set. This naturally handles multi-day events (every spanned day gets the dot) and dedups when several events of the same type fall on one day.
- We iterate the month's events to bound the cursor; using `visibleEvents` ensures the dot reflects current filters.

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: no errors. (TypeScript should be clean now that `EventFilters` props match the new shape.)

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
npm test
```

Expected: all tests green.

- [ ] **Step 4: Commit**

```bash
git add src/pages/EventList.tsx
git commit -m "feat(list): calendar-first layout with month-synced strip"
```

---

## Task 9: Manual mobile verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the printed URL in Chrome.

- [ ] **Step 2: Switch to phone viewport**

Open DevTools → Toggle device toolbar → pick "iPhone 13" (390×844) or similar. The Mini App is phone-first.

- [ ] **Step 3: Verify the calendar surface**

Confirm in the May 2026 view:

- Calendar renders with Monday as the first weekday and Ukrainian month name ("Травень 2026" or similar).
- Today's cell (2026-05-10) shows the `today` highlight.
- Days with seed events have colored dots beneath the number:
  - 2 May – 9 May: sky dot (the Greek yacht trip, multi-day).
  - 4 May: orange dot (offline networking).
  - 6 May: emerald dot (online session).
  - 7 May: orange dot.
  - 9 May: orange + sky dots (offline game + trip end).
  - 11 May: emerald dot (online lecture).

- [ ] **Step 4: Verify the modal**

- Tap 9 May → modal opens with two event rows.
- Tap an event row → navigates to `/event/:id`, modal closes.
- Use the back button → return to `/`, modal stays closed.
- Tap an empty day (e.g., 28 May if seed has none) → no modal; the day still shows the selected pill.
- Tap outside / press the close X on a populated day → modal dismisses.

- [ ] **Step 5: Verify the strip & filters**

- The strip below the calendar shows May events in chronological order.
- Nav to April → strip syncs to April's events (the yacht trip should appear because its start is 2 May and the boundary trip extends backwards if any).
- Nav to June → strip empty (with `t.calendar.monthEmpty` copy).
- Toggle `★ Тільки мої` → calendar dots and strip shrink to the persona's RSVPs; if none, both go empty with `t.list.emptyMine`.
- Switch type filter (e.g., "🟢 Онлайн") → dots and strip narrow to online events only.

- [ ] **Step 6: Verify there are no regressions on other pages**

- Navigate to an event detail page → page renders, RSVP still works.
- Open `/admin/new` (as admin persona) → form unchanged.
- Open `/admin/members` (admin) and `/profile/:userId` (any persona) → unchanged.

- [ ] **Step 7: Final build + lint**

```bash
npm run build
npm run lint
```

Expected: both clean.

- [ ] **Step 8: Final commit (only if any tweaks were needed during manual verification)**

If you made adjustments during the verification, commit them as a single follow-up:

```bash
git add -A
git commit -m "fix(calendar): mobile verification tweaks"
```

If no tweaks were needed, skip this step.

---

## Self-review notes

- **Spec coverage:** Task 1 covers shadcn primitives. Task 2 covers `eventsOnDay`/`eventsInMonth`/`eventTypesOnDay` with TDD. Task 3 covers strings. Tasks 4-6 cover the three new components (`MineToggle`, `EventCalendar`, `DayEventsDialog`). Task 7 covers the `EventFilters` rework. Task 8 wires `EventList.tsx`, including the empty-day selection contract (modal `open` is derived). Task 9 manual-checks every edge case from the spec (multi-day dots, empty days, Mine toggle, type filter, locale).
- **Mock-only:** Every data path uses the existing `eventsQuery` / `allRsvpsQuery` / `meQuery`, which already route through the in-memory mock client introduced in `1044bc7`. No new Supabase touchpoints.
- **No placeholders:** Every code step is complete code; no "TBD" or "similar to above" elsewhere.
- **Type consistency:** `EventCalendar` props match the call site in `EventList.tsx`. `DayEventsDialog` props match. `MineToggle` props match. `EventFilters` props (now `{type, onTypeChange}`) match the call site.
