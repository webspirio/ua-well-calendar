# Quick Wins Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship seven small, visible improvements (A1, B6, C3, C4, D1, E1, F3 from `docs/QUICK_WINS.md`) against the local-demo build of the UA WELL calendar app.

**Architecture:** One additive Supabase migration (`0004_quick_wins.sql`) adds `rsvps.attended boolean` and `events.speaker_user_id uuid`. Six new React components and four lib/strings edits surface the features. Five commits, one per thematic group. No new mutations beyond a direct UPDATE on `rsvps` for attendance.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 + shadcn (Badge, new Skeleton) + @tanstack/react-query + Supabase JS + Vitest. Mock today = `2026-05-10T12:00+02:00`, defined in `src/lib/dates.ts`.

**Spec:** `docs/superpowers/specs/2026-05-20-quick-wins-design.md`.

---

## Pre-flight

- [ ] **Step 0a: Verify local Supabase is running**

  Run: `npx supabase status`
  Expected: shows running services with an `anon key` and `API URL http://127.0.0.1:54321`. If not running: `npm run db:start`.

- [ ] **Step 0b: Verify `.env.local` is populated**

  Run: `grep VITE_SUPABASE_ANON_KEY .env.local && grep VITE_SUPABASE_URL .env.local`
  Expected: both keys present. If missing, copy from `npx supabase status` output into `.env.local`.

- [ ] **Step 0c: Verify clean baseline**

  Run: `npm run lint && npm test && npm run build`
  Expected: all green. If any fail, stop and report — don't start work on a red baseline.

---

## Commit 1 — Schema + seed updates

**Goal:** add the two columns, update seed for speakers + bumped Велотур RSVP, expose them in `queries.ts` types.

### Task 1.1 — Migration file

**Files:**
- Create: `supabase/migrations/0004_quick_wins.sql`

- [ ] **Step 1: Create the migration file**

  Create `supabase/migrations/0004_quick_wins.sql` with this exact content:

  ```sql
  -- Quick wins bundle: attendance tracking + speaker assignment.
  -- Both columns are nullable and purely additive.

  alter table rsvps
    add column attended boolean;

  alter table events
    add column speaker_user_id uuid references users(id);
  ```

- [ ] **Step 2: Apply via `db:reset`**

  Run: `npm run db:reset`
  Expected: output ends with "Finished `supabase db reset` on branch ..." and shows the new migration applied. Studio SQL `select column_name from information_schema.columns where table_name='rsvps' and column_name='attended'` returns one row.

### Task 1.2 — Seed updates

**Files:**
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Add `speaker_user_id` to event #4**

  Find the `insert into events ... values (` block whose first column value is `'11111111-1111-1111-1111-000000000004',`. The current row ends with `'events/07.05.jpg'`. Add `speaker_user_id` to that single insert.

  Replace the existing insert for event #4:

  ```sql
  -- 4. 🟠 07.05 (чт) 17:00 Штутгарт
  insert into events (id, creator_id, title, description, location, starts_at, ends_at, type, capacity, image_url) values (
    '11111111-1111-1111-1111-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Workshop — «Стратегії в бізнесі»',
    E'Спікер: Віталій Горбань.\n\nБрейн-штормінг, де кожен буде включений в процес створення бізнес-стратегії для одного з учасників зустрічі.\n\n👋 Приходь, щоб пропрацювати стратегію твого бізнесу або допомогти колегам по Community.',
    'Штутгарт',
    '2026-05-07 17:00:00+02', '2026-05-07 20:00:00+02',
    'offline', 20,
    'events/07.05.jpg'
  );
  ```

  …with this version (adds `speaker_user_id` column + value):

  ```sql
  -- 4. 🟠 07.05 (чт) 17:00 Штутгарт
  insert into events (id, creator_id, title, description, location, starts_at, ends_at, type, capacity, image_url, speaker_user_id) values (
    '11111111-1111-1111-1111-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Workshop — «Стратегії в бізнесі»',
    E'Спікер: Віталій Горбань.\n\nБрейн-штормінг, де кожен буде включений в процес створення бізнес-стратегії для одного з учасників зустрічі.\n\n👋 Приходь, щоб пропрацювати стратегію твого бізнесу або допомогти колегам по Community.',
    'Штутгарт',
    '2026-05-07 17:00:00+02', '2026-05-07 20:00:00+02',
    'offline', 20,
    'events/07.05.jpg',
    '00000000-0000-0000-0000-000000000019'
  );
  ```

- [ ] **Step 2: Add `speaker_user_id` to event #6**

  Same pattern. Replace event #6's insert (the one starting `'11111111-1111-1111-1111-000000000006',`) with:

  ```sql
  -- 6. 🟢 11.05 (пн) 18:00 Online — Аналіз ніші (TOMORROW relative to mock today)
  insert into events (id, creator_id, title, description, location, starts_at, ends_at, type, capacity, image_url, speaker_user_id) values (
    '11111111-1111-1111-1111-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Аналіз ніші та конкурентів',
    E'Як зрозуміти, що реально працює у маркетингу.\nСпікер: Антон Ященко — Online Marketing Manager та YouTube-creator, засновник відеопродакшену.\n\nТи дізнаєшся:\n🔹 як проводити глибокий аналіз ніші та конкурентів і приймати рішення на основі фактів\n🔹 як створити таблицю аналізу для побудови маркетингової стратегії\n🔹 як обрати ефективні платформи та розставити пріоритети в просуванні\n🔹 як аналізувати рекламу, сайти та соцмережі конкурентів\n🔹 як знаходити працюючі формати й точки росту для свого бізнесу.\n\nНа лекції ми не лише розберемо теорію, а й разом заповнимо таблицю, яка допоможе зрозуміти:\n— де бути присутнім\n— що і як часто публікувати\n— куди вкладати ресурси.\n\n🎁 Бонус: розіграш розбору ніші одного з учасників з практичними рекомендаціями.',
    'Online',
    '2026-05-11 18:00:00+02', '2026-05-11 20:00:00+02',
    'online', 100,
    'events/11.05.jpg',
    '00000000-0000-0000-0000-00000000001a'
  );
  ```

- [ ] **Step 3: Bump Велотур to 12/15**

  Find the block of "going" RSVPs for event id `'11111111-1111-1111-1111-000000000009'` (Велотур). The last row in that block is currently `('11111111-1111-1111-1111-000000000009', '00000000-0000-0000-0000-00000000001e', 'going'),`.

  Insert one additional row immediately AFTER that line, BEFORE the `-- 10. Мюнхен` block, so the Велотур list ends with these two lines:

  ```sql
    ('11111111-1111-1111-1111-000000000009', '00000000-0000-0000-0000-00000000001e', 'going'),
    ('11111111-1111-1111-1111-000000000009', '00000000-0000-0000-0000-00000000001b', 'going'),
  ```

  Also update the counts comment at the top of the RSVP block:

  Find: `--   9 Велотур (cap 15):             11 going (future)`
  Replace with: `--   9 Велотур (cap 15):             12 going (future) — crosses 75% threshold`

- [ ] **Step 4: Re-apply seed**

  Run: `npm run db:reset`
  Expected: completes without errors. Studio SQL `select id from events where speaker_user_id is not null` returns two rows; `select count(*) from rsvps where event_id='11111111-1111-1111-1111-000000000009' and status='going'` returns 12.

### Task 1.3 — Types in `queries.ts`

**Files:**
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: Extend `EventRow` and `RsvpRow`**

  In `src/lib/queries.ts`, update the `EventRow` type — add `speaker_user_id`:

  Replace:
  ```ts
  export type EventRow = {
    id: string
    title: string
    description: string | null
    location: string | null
    starts_at: string
    ends_at: string
    type: EventType
    capacity: number
    creator_id: string
    image_url: string | null
    tg_message_id: number | null
    tg_chat_id: number | null
  }
  ```
  With:
  ```ts
  export type EventRow = {
    id: string
    title: string
    description: string | null
    location: string | null
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
  ```

  Update `RsvpRow`:

  Replace:
  ```ts
  export type RsvpRow = {
    event_id: string
    user_id: string
    status: "going" | "cancelled"
  }
  ```
  With:
  ```ts
  export type RsvpRow = {
    event_id: string
    user_id: string
    status: "going" | "cancelled"
    attended: boolean | null
  }
  ```

- [ ] **Step 2: Update `EVENT_COLS` and rsvp selects**

  Replace:
  ```ts
  const EVENT_COLS =
    "id, title, description, location, starts_at, ends_at, type, capacity, creator_id, image_url, tg_message_id, tg_chat_id"
  ```
  With:
  ```ts
  const EVENT_COLS =
    "id, title, description, location, starts_at, ends_at, type, capacity, creator_id, image_url, tg_message_id, tg_chat_id, speaker_user_id"
  ```

  In `rsvpsQuery` and `allRsvpsQuery`, replace `.select("event_id, user_id, status")` (two occurrences) with `.select("event_id, user_id, status, attended")`.

- [ ] **Step 3: Typecheck**

  Run: `npx tsc -b`
  Expected: no errors. If the existing code somewhere destructured `EventRow` exhaustively, fix at the call site by adding the new field — but `EventRow` is only used by reference, so no edits expected.

- [ ] **Step 4: Commit**

  ```bash
  git add supabase/migrations/0004_quick_wins.sql supabase/seed.sql src/lib/queries.ts
  git commit -m "feat(db): add rsvps.attended + events.speaker_user_id + seed updates"
  ```

---

## Commit 2 — Attendance check-in (A1)

**Goal:** admin can mark RSVPs as present / no-show on past or in-progress events.

### Task 2.1 — Strings

**Files:**
- Modify: `src/lib/strings.ts`

- [ ] **Step 1: Add attendance + toast strings**

  Inside the `detail:` object in `src/lib/strings.ts`, add these keys (anywhere in the object):

  ```ts
      attendanceHeading: (yes: number, total: number) =>
        `Відмітити присутніх — ${yes} / ${total}`,
      attendedYes: "Прийшов",
      attendedNo: "Не прийшов",
      attendedClear: "—",
  ```

  Inside the `toast:` object, add:

  ```ts
      attendanceSaved: "Збережено",
      attendanceFailed: "Не вдалося зберегти",
  ```

### Task 2.2 — Component

**Files:**
- Create: `src/components/AttendanceSheet.tsx`

- [ ] **Step 1: Write the component**

  Create `src/components/AttendanceSheet.tsx`:

  ```tsx
  import { useMemo } from "react"
  import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
  import { toast } from "sonner"
  import { Button } from "@/components/ui/button"
  import { AvatarStack } from "./AvatarStack"
  import { rsvpsQuery, usersQuery } from "@/lib/queries"
  import { supabase } from "@/lib/supabase"
  import { t } from "@/lib/strings"
  import { cn } from "@/lib/utils"

  type Props = { eventId: string }

  export function AttendanceSheet({ eventId }: Props) {
    const queryClient = useQueryClient()
    const { data: rsvps } = useQuery(rsvpsQuery(eventId))
    const { data: users } = useQuery(usersQuery())

    const goingRows = useMemo(() => {
      if (!rsvps || !users) return []
      const byId = new Map(users.map((u) => [u.id, u]))
      return rsvps
        .filter((r) => r.status === "going")
        .map((r) => ({ rsvp: r, user: byId.get(r.user_id) }))
        .filter((row): row is { rsvp: typeof row.rsvp; user: NonNullable<typeof row.user> } => !!row.user)
    }, [rsvps, users])

    const attendedYes = goingRows.filter((row) => row.rsvp.attended === true).length

    const setAttended = useMutation({
      mutationFn: async (vars: { userId: string; value: boolean | null }) => {
        const { error } = await supabase
          .from("rsvps")
          .update({ attended: vars.value })
          .eq("event_id", eventId)
          .eq("user_id", vars.userId)
        if (error) throw error
      },
      onSuccess: () => {
        toast.success(t.toast.attendanceSaved)
        queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] })
      },
      onError: (e: Error) => toast.error(`${t.toast.attendanceFailed}: ${e.message}`),
    })

    if (goingRows.length === 0) return null

    return (
      <section className="space-y-3 border-t pt-5">
        <h2 className="text-base font-semibold">
          {t.detail.attendanceHeading(attendedYes, goingRows.length)}
        </h2>
        <ul className="space-y-2">
          {goingRows.map(({ rsvp, user }) => (
            <li key={user.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AvatarStack users={[{ id: user.id, first_name: user.first_name }]} max={1} size="sm" />
                <span className="truncate text-sm">{user.first_name ?? "—"}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <ToggleBtn
                  active={rsvp.attended === true}
                  label={t.detail.attendedYes}
                  variant="yes"
                  onClick={() =>
                    setAttended.mutate({
                      userId: user.id,
                      value: rsvp.attended === true ? null : true,
                    })
                  }
                />
                <ToggleBtn
                  active={rsvp.attended === false}
                  label={t.detail.attendedNo}
                  variant="no"
                  onClick={() =>
                    setAttended.mutate({
                      userId: user.id,
                      value: rsvp.attended === false ? null : false,
                    })
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  function ToggleBtn({
    active,
    label,
    variant,
    onClick,
  }: {
    active: boolean
    label: string
    variant: "yes" | "no"
    onClick: () => void
  }) {
    return (
      <Button
        type="button"
        size="sm"
        variant={active ? "default" : "outline"}
        onClick={onClick}
        className={cn(
          "h-7 px-2.5 text-xs",
          active && variant === "yes" && "bg-emerald-600 hover:bg-emerald-600/90",
          active && variant === "no" && "bg-rose-600 hover:bg-rose-600/90",
        )}
      >
        {label}
      </Button>
    )
  }
  ```

### Task 2.3 — Wire into `EventDetail`

**Files:**
- Modify: `src/pages/EventDetail.tsx`

- [ ] **Step 1: Import and render**

  In `src/pages/EventDetail.tsx`, add the import near the other component imports:

  ```ts
  import { AttendanceSheet } from "@/components/AttendanceSheet"
  ```

  Find the line `<EventGoingList eventId={id} />`. Immediately AFTER it, add:

  ```tsx
        {me?.is_admin && (past || isToday(event.starts_at, event.ends_at)) && (
          <AttendanceSheet eventId={id} />
        )}
  ```

  The component already imports `isPast` from `@/lib/dates`. Add `isToday` to that import:

  Replace:
  ```ts
  import { formatEventWhen, isPast } from "@/lib/dates"
  ```
  With:
  ```ts
  import { formatEventWhen, isPast, isToday } from "@/lib/dates"
  ```

- [ ] **Step 2: Typecheck and lint**

  Run: `npm run lint`
  Expected: no new errors.

  Run: `npx tsc -b`
  Expected: no errors.

- [ ] **Step 3: Manual smoke test**

  Run: `npm run dev`
  Expected: open `http://localhost:5173/`, switch persona to Олександр (admin), open any past event (e.g. Workshop Штутгарт, 07.05). The "Відмітити присутніх — 0 / N" section appears below "Хто йде". Click "Прийшов" on one row — counter increments, toast appears. Click again on the same row — value clears (counter decrements).

- [ ] **Step 4: Commit**

  ```bash
  git add src/lib/strings.ts src/components/AttendanceSheet.tsx src/pages/EventDetail.tsx
  git commit -m "feat(detail): attendance check-in sheet for admins (A1)"
  ```

---

## Commit 3 — Hot/Almost-full badge + Next-up hero + Speaker badge (B6, C4, D1)

**Goal:** card surface signals: urgency badge, hero banner above the list, speaker chip on detail + going-list.

### Task 3.1 — Unit-test the pure helpers (TDD)

**Files:**
- Create: `tests/quick_wins.test.ts`

- [ ] **Step 1: Write failing tests for `hotness` and `formatCountdown`**

  Create `tests/quick_wins.test.ts`:

  ```ts
  import { describe, expect, it } from "vitest"
  import { hotness } from "@/lib/eventBadges"
  import { formatCountdown } from "@/lib/dates"

  describe("hotness(going, capacity, past)", () => {
    it("returns null when past", () => {
      expect(hotness(8, 8, true)).toBeNull()
    })
    it("returns null below 75%", () => {
      expect(hotness(5, 10, false)).toBeNull()
      expect(hotness(7, 10, false)).toBeNull()
    })
    it("returns 'almost-full' between 75% and 99%", () => {
      expect(hotness(8, 10, false)).toBe("almost-full")
      expect(hotness(12, 15, false)).toBe("almost-full")
      expect(hotness(99, 100, false)).toBe("almost-full")
    })
    it("returns 'full' at or above 100%", () => {
      expect(hotness(10, 10, false)).toBe("full")
      expect(hotness(11, 10, false)).toBe("full")
    })
  })

  describe("formatCountdown(startsAt)", () => {
    // Mock-today in dates.ts is 2026-05-10T12:00+02:00.
    it("returns 'вже починається' when in the past or right now", () => {
      expect(formatCountdown("2026-05-10T11:59:00+02:00")).toBe("вже починається")
      expect(formatCountdown("2026-05-10T12:00:00+02:00")).toBe("вже починається")
    })
    it("returns 'через N хв' for sub-hour", () => {
      expect(formatCountdown("2026-05-10T12:30:00+02:00")).toBe("через 30 хв")
    })
    it("returns 'сьогодні о HH:mm' for later today", () => {
      expect(formatCountdown("2026-05-10T18:00:00+02:00")).toBe("сьогодні о 18:00")
    })
    it("returns 'завтра о HH:mm' for next day", () => {
      expect(formatCountdown("2026-05-11T18:00:00+02:00")).toBe("завтра о 18:00")
    })
    it("returns 'через N днів' for 2–6 days", () => {
      expect(formatCountdown("2026-05-13T10:00:00+02:00")).toBe("через 3 дні")
      expect(formatCountdown("2026-05-15T10:00:00+02:00")).toBe("через 5 днів")
    })
    it("returns 'через N тиж' for ≥ 7 days", () => {
      expect(formatCountdown("2026-05-17T10:00:00+02:00")).toBe("через 1 тиж")
      expect(formatCountdown("2026-05-24T10:00:00+02:00")).toBe("через 2 тиж")
    })
  })
  ```

- [ ] **Step 2: Run the test to confirm it fails**

  Run: `npm test -- tests/quick_wins.test.ts`
  Expected: FAIL — modules `@/lib/eventBadges` and the `formatCountdown` export from `dates` don't exist yet.

### Task 3.2 — `formatCountdown` helper

**Files:**
- Modify: `src/lib/dates.ts`

- [ ] **Step 1: Extend the `date-fns` import**

  At the top of `src/lib/dates.ts`, replace:

  ```ts
  import { format, isSameDay, isSameMonth, differenceInCalendarDays } from "date-fns"
  ```
  With (adds `differenceInMinutes`):
  ```ts
  import {
    format,
    isSameDay,
    isSameMonth,
    differenceInCalendarDays,
    differenceInMinutes,
  } from "date-fns"
  ```

- [ ] **Step 2: Append `formatCountdown` and `plural` helpers**

  Append to the bottom of `src/lib/dates.ts`:

  ```ts
  export function formatCountdown(startsAt: string): string {
    const s = new Date(startsAt)
    const today = now()
    const mins = differenceInMinutes(s, today)
    if (mins <= 0) return "вже починається"
    if (mins < 60) return `через ${mins} хв`
    if (isSameDay(s, today)) return `сьогодні о ${format(s, "HH:mm")}`
    const days = differenceInCalendarDays(s, today)
    if (days === 1) return `завтра о ${format(s, "HH:mm")}`
    if (days < 7) return `через ${days} ${plural(days, "день", "дні", "днів")}`
    const weeks = Math.floor(days / 7)
    return `через ${weeks} тиж`
  }

  function plural(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
  }
  ```

### Task 3.3 — `hotness` helper

**Files:**
- Create: `src/lib/eventBadges.ts`

- [ ] **Step 1: Write the helper**

  Create `src/lib/eventBadges.ts`:

  ```ts
  export type Hotness = "almost-full" | "full" | null

  export function hotness(going: number, capacity: number, past: boolean): Hotness {
    if (past) return null
    const ratio = going / capacity
    if (ratio >= 1) return "full"
    if (ratio >= 0.75) return "almost-full"
    return null
  }
  ```

### Task 3.4 — Verify unit tests pass

- [ ] **Step 1: Run unit tests**

  Run: `npm test -- tests/quick_wins.test.ts`
  Expected: all `hotness` + `formatCountdown` cases PASS. If `через 3 дні` vs `через 3 день` mismatches, the `plural` function is wrong — debug there.

### Task 3.5 — Strings for badges + hero

**Files:**
- Modify: `src/lib/strings.ts`

- [ ] **Step 1: Add new keys**

  In the `list:` object, add:
  ```ts
      almostFull: "🔥 Майже всі місця зайнято",
      full: "Місць не залишилось",
      nextUpHeading: "Найближча подія",
  ```

  In the `detail:` object, add:
  ```ts
      speaker: (name: string) => `Спікер: ${name}`,
      speakerBadge: "Спікер",
  ```

### Task 3.6 — Hot/Almost-full badge in `EventCard`

**Files:**
- Modify: `src/components/EventCard.tsx`

- [ ] **Step 1: Add the badge**

  Add the import:
  ```ts
  import { hotness } from "@/lib/eventBadges"
  ```

  Add this just after the line `const going = goingUsers.length` (and before `const past = isPast(event.ends_at)` — leave existing logic intact):

  ```ts
    const heat = hotness(going, event.capacity, isPast(event.ends_at))
  ```

  Inside the `<article>` JSX, find the existing footer:

  ```tsx
          <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
            <Badge variant="outline">
              {t.list.goingCount(going, event.capacity)}
            </Badge>
            <AvatarStack users={goingUsers} max={4} size="sm" />
          </div>
  ```

  Replace with (adds a heat badge on its own line, before the going/avatars row):

  ```tsx
          {heat && (
            <div className="pt-1">
              <Badge
                className={
                  heat === "full"
                    ? "bg-muted text-muted-foreground hover:bg-muted"
                    : "bg-rose-500 hover:bg-rose-500 text-white"
                }
              >
                {heat === "full" ? t.list.full : t.list.almostFull}
              </Badge>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
            <Badge variant="outline">
              {t.list.goingCount(going, event.capacity)}
            </Badge>
            <AvatarStack users={goingUsers} max={4} size="sm" />
          </div>
  ```

### Task 3.7 — Next-up hero component

**Files:**
- Create: `src/components/NextUpHero.tsx`

- [ ] **Step 1: Write the component**

  Create `src/components/NextUpHero.tsx`:

  ```tsx
  import { Link } from "react-router"
  import { Badge } from "@/components/ui/badge"
  import { formatEventWhen, formatCountdown, isPast, now } from "@/lib/dates"
  import { t } from "@/lib/strings"
  import { cn } from "@/lib/utils"
  import type { EventRow } from "@/lib/queries"

  type Props = { events: EventRow[] }

  function imgSrc(rel: string): string {
    return `${import.meta.env.BASE_URL}${rel}`
  }

  export function NextUpHero({ events }: Props) {
    const today = now().getTime()
    const next = events
      .filter((ev) => !isPast(ev.ends_at) && new Date(ev.starts_at).getTime() > today)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0]

    if (!next) return null

    const typeMeta = t.types[next.type]

    return (
      <Link
        to={`/event/${next.id}`}
        className="block rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition"
      >
        <div className="flex gap-3 sm:gap-4 items-stretch">
          <div className="relative shrink-0 w-28 sm:w-40 bg-muted">
            {next.image_url ? (
              <img
                src={imgSrc(next.image_url)}
                alt={next.title}
                className={cn("h-full w-full object-cover aspect-[4/5]")}
              />
            ) : (
              <div className="aspect-[4/5] flex items-center justify-center text-4xl">
                {typeMeta.emoji}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-1.5">
            <Badge variant="secondary" className="w-fit">
              {t.list.nextUpHeading}
            </Badge>
            <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2">
              {next.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {formatEventWhen(next.starts_at, next.ends_at)}
            </p>
            <p className="text-sm font-medium">{formatCountdown(next.starts_at)}</p>
          </div>
        </div>
      </Link>
    )
  }
  ```

### Task 3.8 — Render the hero on `EventList`

**Files:**
- Modify: `src/pages/EventList.tsx`

- [ ] **Step 1: Render hero above filters when appropriate**

  Add the import:
  ```ts
  import { NextUpHero } from "@/components/NextUpHero"
  ```

  Inside the returned JSX, find the existing `<EventFilters …/>` block. Immediately BEFORE that line, add:

  ```tsx
        {time !== "past" && time !== "mine" && <NextUpHero events={events} />}
  ```

  Note: `time === "mine"` is added in commit 4. For now, just guard on `"past"`:

  ```tsx
        {time !== "past" && <NextUpHero events={events} />}
  ```

  (We'll add the `"mine"` guard in commit 4 when we add that filter value.)

### Task 3.9 — Speaker line on `EventDetail`

**Files:**
- Modify: `src/pages/EventDetail.tsx`

- [ ] **Step 1: Resolve speaker user**

  Add the import:
  ```ts
  import { usersQuery } from "@/lib/queries"
  ```

  After the existing `const { data: me } = useQuery(meQuery(userId))` line, add:

  ```ts
    const { data: users } = useQuery(usersQuery())
    const speaker = event?.speaker_user_id
      ? users?.find((u) => u.id === event.speaker_user_id)
      : null
  ```

  Note: `eventQuery` is loaded async; place the `speaker` derivation AFTER all `useQuery` calls but you must guard with `event?.speaker_user_id`. The code above does that.

- [ ] **Step 2: Render speaker line in header**

  Find the `<header>` block:

  ```tsx
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold leading-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatEventWhen(event.starts_at, event.ends_at)}
          </p>
          {event.location && (
            <p className="text-sm text-muted-foreground">{event.location}</p>
          )}
        </header>
  ```

  Add a `speaker` line after location:

  ```tsx
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold leading-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatEventWhen(event.starts_at, event.ends_at)}
          </p>
          {event.location && (
            <p className="text-sm text-muted-foreground">{event.location}</p>
          )}
          {speaker?.first_name && (
            <p className="text-sm font-medium text-foreground/90">
              {t.detail.speaker(speaker.first_name)}
            </p>
          )}
        </header>
  ```

### Task 3.10 — Speaker badge in `EventGoingList`

**Files:**
- Modify: `src/components/EventGoingList.tsx`

- [ ] **Step 1: Accept speaker prop and render badge**

  Replace the entire file content with:

  ```tsx
  import { useMemo } from "react"
  import { useQuery } from "@tanstack/react-query"
  import { Link } from "react-router"
  import { Badge } from "@/components/ui/badge"
  import { rsvpsQuery, usersQuery } from "@/lib/queries"
  import { AvatarStack } from "./AvatarStack"
  import { t } from "@/lib/strings"

  type Props = { eventId: string; speakerUserId?: string | null }

  export function EventGoingList({ eventId, speakerUserId }: Props) {
    const { data: rsvps } = useQuery(rsvpsQuery(eventId))
    const { data: users } = useQuery(usersQuery())

    const goingUsers = useMemo(() => {
      if (!rsvps || !users) return []
      const byId = new Map(users.map((u) => [u.id, u]))
      return rsvps
        .filter((r) => r.status === "going")
        .map((r) => byId.get(r.user_id))
        .filter((u): u is NonNullable<typeof u> => !!u)
    }, [rsvps, users])

    return (
      <section className="space-y-3 border-t pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            {t.detail.rsvpsHeading} · {goingUsers.length}
          </h2>
          <AvatarStack users={goingUsers.slice(0, 6)} max={6} size="md" />
        </div>
        {goingUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.detail.rsvpsEmpty}</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {goingUsers.map((u) => (
              <li key={u.id} className="min-w-0">
                <Link
                  to={`/profile/${u.id}`}
                  className="flex items-center gap-2 min-w-0 rounded-md px-1 py-0.5 hover:bg-accent/40 transition-colors"
                >
                  <AvatarStack users={[u]} max={1} size="sm" />
                  <span className="truncate">{u.first_name ?? "—"}</span>
                  {speakerUserId && u.id === speakerUserId && (
                    <Badge variant="secondary" className="ml-auto shrink-0">
                      {t.detail.speakerBadge}
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }
  ```

- [ ] **Step 2: Pass `speakerUserId` from `EventDetail`**

  In `src/pages/EventDetail.tsx`, find:
  ```tsx
        <EventGoingList eventId={id} />
  ```
  Replace with:
  ```tsx
        <EventGoingList eventId={id} speakerUserId={event.speaker_user_id} />
  ```

### Task 3.11 — Verify build + smoke

- [ ] **Step 1: Lint, typecheck, test**

  Run: `npm run lint && npx tsc -b && npm test`
  Expected: all green. New `tests/quick_wins.test.ts` passes; race test still passes.

- [ ] **Step 2: Manual smoke**

  Run: `npm run dev`
  Expected (on `http://localhost:5173/`):
  - The "Найближча подія" hero shows event #6 (Аналіз ніші, 11.05) with text "завтра о 18:00".
  - Велотур card shows the rose "🔥 Майже всі місця зайнято" badge.
  - Open Workshop Штутгарт (event #4) detail — header includes "Спікер: Віталій". In "Хто йде" section, Віталій's row has a "Спікер" badge.

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/dates.ts src/lib/eventBadges.ts src/lib/strings.ts \
          src/components/EventCard.tsx src/components/NextUpHero.tsx \
          src/components/EventGoingList.tsx \
          src/pages/EventList.tsx src/pages/EventDetail.tsx \
          tests/quick_wins.test.ts
  git commit -m "feat(card): hot/almost-full badge + next-up hero + speaker badge (B6, C4, D1)"
  ```

---

## Commit 4 — "Мої події" filter (C3)

**Goal:** add a fourth time filter that shows only events the current user has a `going` RSVP for.

### Task 4.1 — Test the filter logic (TDD)

**Files:**
- Modify: `tests/quick_wins.test.ts`

- [ ] **Step 1: Add failing test**

  Append to `tests/quick_wins.test.ts`:

  ```ts
  import { filterMine } from "@/lib/eventBadges"
  import type { EventRow, RsvpRow } from "@/lib/queries"

  describe("filterMine(events, rsvps, userId)", () => {
    const me = "user-me"
    const other = "user-other"
    const ev = (id: string): EventRow => ({
      id, title: id, description: null, location: null,
      starts_at: "2026-05-11T18:00:00+02:00", ends_at: "2026-05-11T20:00:00+02:00",
      type: "online", capacity: 10, creator_id: "x",
      image_url: null, tg_message_id: null, tg_chat_id: null,
      speaker_user_id: null,
    })
    const events: EventRow[] = [ev("a"), ev("b"), ev("c")]

    it("keeps only events where the user is going", () => {
      const rsvps: RsvpRow[] = [
        { event_id: "a", user_id: me,    status: "going",     attended: null },
        { event_id: "b", user_id: me,    status: "cancelled", attended: null },
        { event_id: "c", user_id: other, status: "going",     attended: null },
      ]
      expect(filterMine(events, rsvps, me).map((e) => e.id)).toEqual(["a"])
    })

    it("returns empty when user has no going rsvps", () => {
      expect(filterMine(events, [], me)).toEqual([])
    })
  })
  ```

- [ ] **Step 2: Confirm test fails**

  Run: `npm test -- tests/quick_wins.test.ts`
  Expected: FAIL — `filterMine` not exported.

### Task 4.2 — Implement `filterMine`

**Files:**
- Modify: `src/lib/eventBadges.ts`

- [ ] **Step 1: Add `filterMine`**

  Append to `src/lib/eventBadges.ts`:

  ```ts
  import type { EventRow, RsvpRow } from "./queries"

  export function filterMine(events: EventRow[], rsvps: RsvpRow[], userId: string): EventRow[] {
    const mine = new Set(
      rsvps.filter((r) => r.user_id === userId && r.status === "going").map((r) => r.event_id),
    )
    return events.filter((ev) => mine.has(ev.id))
  }
  ```

- [ ] **Step 2: Confirm test passes**

  Run: `npm test -- tests/quick_wins.test.ts`
  Expected: all PASS.

### Task 4.3 — TimeFilter type + chip

**Files:**
- Modify: `src/components/EventFilters.tsx`
- Modify: `src/lib/strings.ts`

- [ ] **Step 1: Add string**

  In `src/lib/strings.ts`, inside the `filters:` object, add:
  ```ts
      timeMine: "Мої",
  ```

  And in the `list:` object, add:
  ```ts
      emptyMine: "Ви ще нікуди не зареєструвалися.",
  ```

- [ ] **Step 2: Extend `TimeFilter` and `timeOptions`**

  In `src/components/EventFilters.tsx`, replace:

  ```ts
  export type TimeFilter = "all" | "upcoming" | "past"
  ```
  With:
  ```ts
  export type TimeFilter = "all" | "upcoming" | "past" | "mine"
  ```

  Replace the `timeOptions` array:

  ```ts
    const timeOptions: { value: TimeFilter; label: string }[] = [
      { value: "upcoming", label: t.filters.timeUpcoming },
      { value: "past",     label: t.filters.timePast },
      { value: "all",      label: t.filters.timeAll },
    ]
  ```
  With:
  ```ts
    const timeOptions: { value: TimeFilter; label: string }[] = [
      { value: "upcoming", label: t.filters.timeUpcoming },
      { value: "past",     label: t.filters.timePast },
      { value: "mine",     label: t.filters.timeMine },
      { value: "all",      label: t.filters.timeAll },
    ]
  ```

### Task 4.4 — Apply filter in `EventList`

**Files:**
- Modify: `src/pages/EventList.tsx`

- [ ] **Step 1: Pull `allRsvpsQuery` + apply filter**

  Add imports:
  ```ts
  import { allRsvpsQuery } from "@/lib/queries"
  import { filterMine } from "@/lib/eventBadges"
  ```

  Inside `EventList`, after the existing `useQuery(eventsQuery())` line, add:

  ```ts
    const { data: allRsvps } = useQuery(allRsvpsQuery())
  ```

  Replace the existing `filtered` `useMemo`:

  ```ts
    const filtered = useMemo(() => {
      if (!events) return []
      return events.filter((ev) => {
        if (type !== "all" && ev.type !== type) return false
        const past = isPast(ev.ends_at)
        if (time === "upcoming" && past) return false
        if (time === "past" && !past) return false
        return true
      })
    }, [events, time, type])
  ```
  With:
  ```ts
    const filtered = useMemo(() => {
      if (!events) return []
      let base = events
      if (time === "mine" && me) {
        base = filterMine(events, allRsvps ?? [], me.id)
      }
      return base.filter((ev) => {
        if (type !== "all" && ev.type !== type) return false
        if (time === "mine") return true
        const past = isPast(ev.ends_at)
        if (time === "upcoming" && past) return false
        if (time === "past" && !past) return false
        return true
      })
    }, [events, time, type, allRsvps, me])
  ```

- [ ] **Step 2: Update empty-state copy + hero guard**

  Replace:
  ```tsx
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {t.list.emptyFiltered}
          </p>
        )
  ```
  With:
  ```tsx
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {time === "mine" ? t.list.emptyMine : t.list.emptyFiltered}
          </p>
        )
  ```

  Replace the hero guard added in commit 3:
  ```tsx
        {time !== "past" && <NextUpHero events={events} />}
  ```
  With:
  ```tsx
        {time !== "past" && time !== "mine" && <NextUpHero events={events} />}
  ```

### Task 4.5 — Verify + smoke + commit

- [ ] **Step 1: Lint, typecheck, test**

  Run: `npm run lint && npx tsc -b && npm test`
  Expected: all green.

- [ ] **Step 2: Manual smoke**

  Run: `npm run dev`
  Expected: switch persona to Марія (the second persona, who has several `going` RSVPs in the seed). Click "Мої" chip → only her events appear (Vielleicht Vielleicht 06.05, Гра Ульм 09.05, Аналіз ніші 11.05, Велотур 16.05). The hero banner disappears. Switch to Павло — different set.

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/eventBadges.ts src/lib/strings.ts \
          src/components/EventFilters.tsx src/pages/EventList.tsx \
          tests/quick_wins.test.ts
  git commit -m 'feat(list): "Мої події" filter (C3)'
  ```

---

## Commit 5 — Skeleton loaders + Share-event button (E1, F3)

### Task 5.1 — shadcn Skeleton primitive

**Files:**
- Create: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Create the primitive**

  Create `src/components/ui/skeleton.tsx`:

  ```tsx
  import type { HTMLAttributes } from "react"
  import { cn } from "@/lib/utils"

  export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
      <div
        className={cn("animate-pulse rounded-md bg-muted", className)}
        {...props}
      />
    )
  }
  ```

### Task 5.2 — Skeleton wrappers

**Files:**
- Create: `src/components/EventCardSkeleton.tsx`
- Create: `src/components/CommentSkeleton.tsx`

- [ ] **Step 1: EventCardSkeleton**

  Create `src/components/EventCardSkeleton.tsx`:

  ```tsx
  import { Skeleton } from "@/components/ui/skeleton"

  export function EventCardSkeleton() {
    return (
      <article className="rounded-xl overflow-hidden border bg-card shadow-sm h-full flex flex-col">
        <Skeleton className="aspect-[4/5] w-full rounded-none" />
        <div className="p-4 space-y-2 flex-1 flex flex-col">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center justify-between gap-2 pt-2 mt-auto">
            <Skeleton className="h-5 w-20" />
            <div className="flex -space-x-1.5">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        </div>
      </article>
    )
  }
  ```

- [ ] **Step 2: CommentSkeleton**

  Create `src/components/CommentSkeleton.tsx`:

  ```tsx
  import { Skeleton } from "@/components/ui/skeleton"

  export function CommentSkeleton() {
    return (
      <li className="flex gap-2.5">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 rounded-lg bg-muted px-3 py-2 space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </li>
    )
  }
  ```

### Task 5.3 — Wire skeletons into EventList

**Files:**
- Modify: `src/pages/EventList.tsx`

- [ ] **Step 1: Replace text-loading branch**

  Add import:
  ```ts
  import { EventCardSkeleton } from "@/components/EventCardSkeleton"
  ```

  Replace:
  ```ts
    if (isLoading) return <p className="text-muted-foreground">{t.list.loading}</p>
  ```
  With:
  ```tsx
    if (isLoading)
      return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-full">
              <EventCardSkeleton />
            </li>
          ))}
        </ul>
      )
  ```

### Task 5.4 — Wire skeletons into EventComments

**Files:**
- Modify: `src/components/EventComments.tsx`

- [ ] **Step 1: Render skeletons while loading**

  Add import:
  ```ts
  import { CommentSkeleton } from "@/components/CommentSkeleton"
  ```

  Find:
  ```tsx
        {comments && comments.length > 0 ? (
          <ul className="space-y-3">
  ```

  Replace the `comments && comments.length > 0 ? (...) : (...)` block with a three-arm conditional:

  ```tsx
        {comments === undefined ? (
          <ul className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CommentSkeleton key={i} />
            ))}
          </ul>
        ) : comments.length > 0 ? (
          <ul className="space-y-3">
            {comments.map((c) => {
              const author = userMap.get(c.user_id)
              return (
                <li key={c.id} className="flex gap-2.5">
                  <Link to={`/profile/${c.user_id}`} className="shrink-0 pt-0.5">
                    <AvatarStack
                      users={[{ id: c.user_id, first_name: author?.first_name ?? null }]}
                      max={1}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 rounded-lg bg-muted px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <Link
                        to={`/profile/${c.user_id}`}
                        className="font-medium text-sm truncate hover:underline"
                      >
                        {author?.first_name ?? "—"}
                      </Link>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatCommentTime(c.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-line text-sm leading-snug">{c.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t.detail.commentsEmpty}</p>
        )}
  ```

### Task 5.5 — Share button component

**Files:**
- Create: `src/components/ShareButton.tsx`

- [ ] **Step 1: Write the component**

  Create `src/components/ShareButton.tsx`:

  ```tsx
  import { toast } from "sonner"
  import { Button } from "@/components/ui/button"
  import { t } from "@/lib/strings"

  type Props = { eventId: string }

  function buildShareUrl(eventId: string): string {
    const botUsername = import.meta.env.VITE_BOT_USERNAME
    if (botUsername) {
      return `https://t.me/${botUsername}/calendar?startapp=event_${eventId}`
    }
    return `${window.location.origin}${window.location.pathname}#/event/${eventId}`
  }

  export function ShareButton({ eventId }: Props) {
    async function onClick() {
      const url = buildShareUrl(eventId)
      try {
        await navigator.clipboard.writeText(url)
        toast.success(t.toast.linkCopied)
      } catch {
        toast.error(t.toast.linkCopyFailed)
      }
    }
    return (
      <Button type="button" variant="outline" onClick={onClick}>
        {t.detail.share}
      </Button>
    )
  }
  ```

### Task 5.6 — Share strings

**Files:**
- Modify: `src/lib/strings.ts`
- Modify: `src/env.d.ts`

- [ ] **Step 1: Add strings**

  In `src/lib/strings.ts`, inside `detail:`, add:
  ```ts
      share: "Поділитись",
  ```

  Inside `toast:`, add:
  ```ts
      linkCopied: "Посилання скопійовано",
      linkCopyFailed: "Не вдалося скопіювати",
  ```

- [ ] **Step 2: Type the env var**

  Open `src/env.d.ts`. If it currently looks like:

  ```ts
  /// <reference types="vite/client" />

  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_FUNCTIONS_URL?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  ```

  Add `VITE_BOT_USERNAME` as optional:

  ```ts
  /// <reference types="vite/client" />

  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_FUNCTIONS_URL?: string
    readonly VITE_BOT_USERNAME?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  ```

  If the file has a different shape, follow that shape — just add the one new readonly line inside the existing `ImportMetaEnv` interface.

### Task 5.7 — Render share button on EventDetail

**Files:**
- Modify: `src/pages/EventDetail.tsx`

- [ ] **Step 1: Add the button**

  Add import:
  ```ts
  import { ShareButton } from "@/components/ShareButton"
  ```

  Find the RSVP action row:

  ```tsx
        {!past && (
          <div className="flex flex-wrap gap-2 pt-2">
            {!isGoing ? (
              <Button … >…</Button>
            ) : (
              <Button … >…</Button>
            )}
          </div>
        )}
  ```

  Replace with (adds `ShareButton` alongside the RSVP button, and renders the row even when `past` so share is always available):

  ```tsx
        <div className="flex flex-wrap gap-2 pt-2">
          {!past && !isGoing && (
            <Button
              onClick={() => goingMutation.mutate()}
              disabled={goingMutation.isPending}
            >
              {goingMutation.isPending ? t.common.loading : t.detail.going}
            </Button>
          )}
          {!past && isGoing && (
            <Button
              variant="secondary"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t.common.loading : t.detail.cancelRsvp}
            </Button>
          )}
          <ShareButton eventId={id} />
        </div>
  ```

### Task 5.8 — Verify + smoke + commit

- [ ] **Step 1: Lint, typecheck, test**

  Run: `npm run lint && npx tsc -b && npm test`
  Expected: all green.

- [ ] **Step 2: Manual smoke**

  Run: `npm run dev`
  Expected:
  - Hard-refresh the list page (Cmd-Shift-R) → for the brief moment before data arrives, you see four shimmer card placeholders instead of "Завантаження…".
  - Open any event detail. A "Поділитись" button is visible next to "Іду"/"Скасувати". Click it → toast "Посилання скопійовано", clipboard has `http://localhost:5173/#/event/<id>`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/ui/skeleton.tsx src/components/EventCardSkeleton.tsx \
          src/components/CommentSkeleton.tsx src/components/ShareButton.tsx \
          src/lib/strings.ts src/env.d.ts \
          src/pages/EventList.tsx src/pages/EventDetail.tsx \
          src/components/EventComments.tsx
  git commit -m "feat(ui): skeleton loaders + share-event button (E1, F3)"
  ```

---

## Final verification gate

- [ ] **Step 1: Full clean check**

  Run: `npm run lint && npx tsc -b && npm test && npm run build`
  Expected: all four green.

- [ ] **Step 2: Full demo walk-through**

  Run: `npm run db:reset && npm run dev`
  Walk-through script:
  1. Open `http://localhost:5173/` → see "Найближча подія" hero (Аналіз ніші, "завтра о 18:00").
  2. Scan card grid → Велотур shows 🔥 badge, Яхтинг (past) does not show 🔥.
  3. Click "Мої" filter → list shrinks to current persona's events; hero gone.
  4. Switch persona → Марія → "Мої" shows different set.
  5. Switch to admin (Олександр) → open Workshop Штутгарт (past event).
     - Header: "Спікер: Віталій".
     - Going list: Віталій's row has "Спікер" badge.
     - "Відмітити присутніх — 0 / 12" block visible. Toggle a few "Прийшов".
     - Counter increments live.
  6. Click "Поділитись" on any event → toast appears.
  7. Hard-refresh list → skeletons flash briefly.

- [ ] **Step 3: Push (optional, user-driven)**

  Do NOT push automatically. Ask the user whether to push. If they say yes:
  ```bash
  git push origin main
  ```
