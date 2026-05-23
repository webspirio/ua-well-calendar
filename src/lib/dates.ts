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

// Mock "today" so the demo always has events both in the past and in the future.
// 10 May 2026 sits between the 09.05 game (past) and the 11.05 lecture (future).
const MOCK_TODAY_ISO = "2026-05-10T12:00:00+02:00"

export function now(): Date {
  return new Date(MOCK_TODAY_ISO)
}

export function isPast(endsAt: string): boolean {
  return new Date(endsAt).getTime() < now().getTime()
}

export function isToday(startsAt: string, endsAt: string): boolean {
  const today = now()
  const s = new Date(startsAt)
  const e = new Date(endsAt)
  return (
    isSameDay(s, today) ||
    isSameDay(e, today) ||
    (s.getTime() <= today.getTime() && e.getTime() >= today.getTime())
  )
}

export function daysUntil(startsAt: string): number {
  return differenceInCalendarDays(new Date(startsAt), now())
}

const FMT_DAY_MONTH = "d MMM"
const FMT_DAY_MONTH_WEEK_TIME = "d MMM (EEEEEE), HH:mm"
const FMT_TIME = "HH:mm"

export function formatEventWhen(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt)
  const e = new Date(endsAt)
  if (isSameDay(s, e)) {
    return `${format(s, FMT_DAY_MONTH_WEEK_TIME, { locale: uk })} – ${format(e, FMT_TIME, { locale: uk })}`
  }
  if (isSameMonth(s, e)) {
    return `${format(s, "d", { locale: uk })} – ${format(e, FMT_DAY_MONTH, { locale: uk })}`
  }
  return `${format(s, FMT_DAY_MONTH, { locale: uk })} – ${format(e, FMT_DAY_MONTH, { locale: uk })}`
}

export function formatShort(date: string): string {
  return format(new Date(date), FMT_DAY_MONTH_WEEK_TIME, { locale: uk })
}

export function formatRelative(date: string): string {
  return format(new Date(date), "d MMM, HH:mm", { locale: uk })
}

export function formatCommentTime(date: string): string {
  const d = new Date(date)
  const today = now()
  if (isSameDay(d, today)) return format(d, "HH:mm", { locale: uk })
  return format(d, FMT_DAY_MONTH, { locale: uk })
}

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

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() <= bEnd.getTime() && aEnd.getTime() >= bStart.getTime()
}

export function eventsOnDay(events: EventRow[], day: Date): EventRow[] {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  return events.filter((ev) => {
    const evStart = new Date(ev.starts_at)
    const evEnd = new Date(ev.ends_at)
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
