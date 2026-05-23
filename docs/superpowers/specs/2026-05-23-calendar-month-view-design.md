# Calendar month view — design

**Date:** 2026-05-23
**Status:** Approved, ready for implementation planning
**Mode:** Local-demo-only (in-memory mock supabase client, no real DB)

## Goal

Add a month calendar view to the Mini App `/` page so members can see a whole month at a glance with dots on days that have events. Tapping a date opens a modal listing that day's events; tapping an event in the modal navigates to the existing `/event/:id` page. The page must work on phone widths first.

## User decisions (locked)

1. **Calendar replaces the list as the primary surface on `/`.** The previous card grid stays, but moves below the calendar as a month-synced strip.
2. **Modal contents:** compact list of the day's events. Each row navigates to the existing `/event/:id` page (no inline RSVP in the modal).
3. **Strip behavior:** synced to the visible month. The previous "Upcoming / Past / Mine" time filter is dropped; type filter is kept.
4. **Multi-day events:** every spanned day is marked.
5. **Day visual:** up to three colored dots under the date number, one per event type present that day. Palette reuses `EventCard`'s gradients: offline=orange, online=emerald, trip=sky. The `★ Тільки мої` toggle (Mine filter) is preserved as a switch above the calendar.

## Architecture

- **No new route.** `src/pages/EventList.tsx` is restructured so the calendar is the primary surface and the existing card grid becomes a month-synced strip.
- **New shadcn primitives** (installed via `npx shadcn add calendar dialog switch`). The `calendar` install also brings in `react-day-picker` as a runtime dep:
  - `src/components/ui/calendar.tsx` (shadcn calendar, react-day-picker v9)
  - `src/components/ui/dialog.tsx`
  - `src/components/ui/switch.tsx`
- **New components:**
  - `src/components/EventCalendar.tsx` — wraps shadcn `Calendar`, renders custom day cells with type-colored dots, accepts controlled `month` / `selectedDay`.
  - `src/components/DayEventsDialog.tsx` — the modal: lists a day's events, each row links to `/event/:id`.
  - `src/components/MineToggle.tsx` — small `★ Тільки мої` switch above the calendar.
- **New helpers in `src/lib/dates.ts`:**
  - `eventsOnDay(events, day)` — events overlapping a calendar day (`start <= endOfDay(day) && end >= startOfDay(day)`).
  - `eventsInMonth(events, monthDate)` — events overlapping the visible month, ordered by `starts_at`.
  - `eventTypesOnDay(events, day)` — deduped `Set<EventType>` for dot rendering.
- **Existing files touched:**
  - `EventList.tsx` — restructured: NextUpHero (kept, but hidden when `mineOnly` is on, matching the previous "hide on Mine view" behavior) → MineToggle → EventCalendar → EventFilters (type only) → month-filtered grid.
  - `EventFilters.tsx` — drop the `time` filter segment and its type; keep the type filter. Update call sites accordingly.
  - `src/lib/strings.ts` — add Ukrainian strings under `t.calendar.*`: `mineToggle`, `modalTitle(date)`, `empty`, etc.

## Data flow & state

State lifted into `EventList.tsx` so the calendar and the strip stay in sync.

```ts
const [month, setMonth] = useState<Date>(now())          // visible month
const [selectedDay, setSelectedDay] = useState<Date | null>(null) // open dialog
const [mineOnly, setMineOnly] = useState(false)
const [type, setType] = useState<TypeFilter>("all")      // existing
```

Data sources (all routed through the existing in-memory mock supabase client — no DB calls):

- `eventsQuery()` — all events.
- `allRsvpsQuery()` + `meQuery(currentUserId())` — for the Mine filter via the existing `filterMine(events, rsvps, me.id)`.

Derived with `useMemo`:

- `visibleEvents` — `events` passed through `filterMine` if `mineOnly`, then through the type filter.
- `monthEvents` — `eventsInMonth(visibleEvents, month)`, for the strip.
- `dayEvents` — `eventsOnDay(visibleEvents, selectedDay)`, computed when `selectedDay != null`, for the dialog.
- `daysWithEvents: Map<string, Set<EventType>>` — keyed by `format(day, "yyyy-MM-dd")`, fed into `EventCalendar` to drive dots.

Event handlers:

- `EventCalendar` `onMonthChange(newMonth)` → `setMonth(newMonth)`.
- `EventCalendar` day click → always `setSelectedDay(d)` (so the day gets react-day-picker's `selected` pill regardless of whether it has events).
- The dialog's open state is **derived**, not separately tracked: `open = selectedDay !== null && dayEvents.length > 0`. Tapping an empty day visually selects it but does not open a modal.
- `DayEventsDialog` `onOpenChange(false)` → `setSelectedDay(null)`.
- Strip card click → existing `<Link to={`/event/${id}`}>`, unchanged.

## Component interfaces

**`EventCalendar`**

```ts
type Props = {
  month: Date
  selectedDay: Date | null
  daysWithEvents: Map<string, Set<EventType>>   // key = "yyyy-MM-dd"
  onMonthChange: (d: Date) => void
  onDayPick: (d: Date) => void
}
```

- Renders shadcn `Calendar` with `mode="single"`, `locale={uk}`, `weekStartsOn={1}` (Monday), controlled `month` / `onMonthChange` and `selected` / `onSelect`.
- Overrides `components.DayButton` (react-day-picker v9 slot) to render the date number plus a row of up to three colored dots below, driven by `daysWithEvents.get(format(day, "yyyy-MM-dd"))`.
- Dot colors map by event type: `offline → bg-orange-500`, `online → bg-emerald-500`, `trip → bg-sky-500`. Dot size `h-1.5 w-1.5 rounded-full`, row uses `gap-0.5`.
- Today's mocked date (`now()` from `src/lib/dates.ts`, currently 2026-05-10) gets react-day-picker's standard `today` modifier styling. Selected day gets the standard `selected` pill.

**`DayEventsDialog`**

```ts
type Props = {
  day: Date | null
  events: EventRow[]
  onOpenChange: (open: boolean) => void
}
```

- `open = day !== null && events.length > 0` (computed by the parent and passed via the `day` prop being `null` when empty; the dialog itself just trusts the prop).
- Header: date in Ukrainian, e.g. *"П'ятниця, 22 травня"* (date-fns `EEEE, d MMMM`, `locale: uk`).
- Body: vertical list of `DayEventRow` items. Each row shows type emoji, title, time range (`HH:mm – HH:mm` for same-day; otherwise multi-day range via existing `formatEventWhen`), truncated location, and a small "X / Y йдуть" badge.
- Each row is a `<Link to={`/event/${id}`}>` that closes the dialog on click (`onOpenChange(false)` in the handler).
- `DialogContent` uses `max-w-sm max-h-[80vh]` with a scrollable `overflow-y-auto` body so a day with many events scrolls inside the modal.

**`MineToggle`**

```ts
type Props = { value: boolean; onChange: (v: boolean) => void }
```

Single-line label + switch. Label string: `t.calendar.mineToggle` (Ukrainian, e.g. `★ Тільки мої`).

## Mobile fit

- `EventCalendar` wrapper: `w-full max-w-sm mx-auto`. On phone fills the column; on tablet caps width so the grid stays readable.
- Day cells: react-day-picker default ~36–40px is fine; dot row fits beneath the number.
- `DialogContent`: shadcn defaults already center and cap width; `max-w-sm max-h-[80vh] overflow-y-auto` for the scrolling body.
- Strip grid: keep `grid-cols-1 sm:grid-cols-2 gap-4` — single column on phone.
- `MineToggle` row sits above the calendar so the calendar's position is stable as the user toggles.

## Edge cases

- **Day with zero events tapped:** day has no dots; tap still updates `selectedDay` so react-day-picker draws the `selected` pill. The dialog stays closed because its `open` derivation requires `dayEvents.length > 0`.
- **Day with one event vs many:** same modal, list of length 1; no special layout.
- **Multi-day events spanning month boundaries:** `eventsOnDay` checks overlap, so both ends of the range light up on whichever month they fall in; the strip's `eventsInMonth` uses the same overlap test, so the event appears in both months' strips.
- **Past events:** dots still render. Strip shows past events with the existing `opacity-70 + grayscale` treatment from `EventCard` (driven by `isPast(ev.ends_at)`).
- **"Mine" toggle on, no RSVPs:** calendar empty of dots, strip empty (`t.list.emptyMine`), dialog cannot open.
- **Month with no events at all:** zero dots; strip shows `t.list.emptyFiltered`; nav still works.
- **Type filter narrows day to zero:** day becomes untappable; collapses to the previous case.
- **Mocked "today" (2026-05-10):** `EventCalendar` initializes `month` to `now()`, so the demo opens on May 2026. Today's cell gets the `today` modifier.
- **Locale:** all month/weekday labels use `locale: uk`. Modal title uses `format(day, "EEEE, d MMMM", { locale: uk })`. Day numbers remain Arabic numerals.
- **Loading state:** while `eventsQuery` is loading, render a skeleton calendar (rough 7×6 grid of muted squares) above a single `EventCardSkeleton`.
- **Error state:** if `eventsQuery` errors, replace the calendar with `<p className="text-muted-foreground">{t.common.error}</p>`, matching the current list behavior.

## Out of scope (YAGNI)

- Week / day view, drag-to-create, repeat-event editing, ICS export.
- Tooltips on dot hover (phone-first; hover is unreliable).
- Persisting `month` / `mineOnly` in URL or localStorage. Component-local state only.
- Real-time updates — TanStack Query's existing cache invalidation on RSVP mutations is sufficient.
- Real Supabase wiring. The mock client introduced in commit `1044bc7` continues to be the only data source.

## Testing

- Extend `tests/dates.test.ts` with unit tests for `eventsOnDay`, `eventsInMonth`, `eventTypesOnDay`. Cases:
  - Single-day event hits exactly that day.
  - Multi-day event hits every day in its range (and only those).
  - Event ending at midnight is treated as belonging to the previous day, not the next.
  - Month boundary: event spanning the last day of month A and first day of month B appears in both `eventsInMonth` results.
  - Type dedup: two events of the same type on one day produce a single dot color.
- No component tests for the calendar UI; demo-mode optimization. shadcn primitives are covered upstream.
- Manual verification: `npm run dev`, open at phone width (Chrome DevTools, iPhone 13). Confirm:
  - Month nav left/right works.
  - 9 May (game, past) and 11 May (lecture, future) carry dots on the May 2026 view.
  - Tap a date with events → modal opens with that day's events.
  - Tap an event row → lands on `/event/:id`, modal closes.
  - Toggle `★ Тільки мої` → dots and strip shrink to RSVP'd events.
  - Switch type filter → dots and strip update.
  - Strip scrolls cleanly on phone width.
