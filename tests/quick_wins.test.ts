import { describe, expect, it } from "vitest"
import { hotness, filterMine, findNextEvent } from "@/lib/eventBadges"
import { formatCountdown } from "@/lib/dates"
import type { EventRow, RsvpRow } from "@/lib/queries"

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

describe("filterMine(events, rsvps, userId)", () => {
  const me = "user-me"
  const other = "user-other"
  const ev = (id: string): EventRow => ({
    id,
    title: id,
    description: null,
    location: null,
    starts_at: "2026-05-11T18:00:00+02:00",
    ends_at: "2026-05-11T20:00:00+02:00",
    type: "online",
    capacity: 10,
    creator_id: "x",
    image_url: null,
    tg_message_id: null,
    tg_chat_id: null,
    speaker_user_id: null,
  })
  const events: EventRow[] = [ev("a"), ev("b"), ev("c")]

  it("keeps only events where the user is going", () => {
    const rsvps: RsvpRow[] = [
      { event_id: "a", user_id: me, status: "going", attended: null },
      { event_id: "b", user_id: me, status: "cancelled", attended: null },
      { event_id: "c", user_id: other, status: "going", attended: null },
    ]
    expect(filterMine(events, rsvps, me).map((e) => e.id)).toEqual(["a"])
  })

  it("returns empty when user has no going rsvps", () => {
    expect(filterMine(events, [], me)).toEqual([])
  })
})

describe("findNextEvent(events, nowMs)", () => {
  const nowMs = new Date("2026-05-10T12:00:00+02:00").getTime()
  const make = (id: string, starts: string, ends: string): EventRow => ({
    id,
    title: id,
    description: null,
    location: null,
    starts_at: starts,
    ends_at: ends,
    type: "online",
    capacity: 10,
    creator_id: "x",
    image_url: null,
    tg_message_id: null,
    tg_chat_id: null,
    speaker_user_id: null,
  })

  it("returns the soonest event that starts after now", () => {
    const events = [
      make("past", "2026-05-08T18:00:00+02:00", "2026-05-08T20:00:00+02:00"),
      make("later", "2026-05-15T18:00:00+02:00", "2026-05-15T20:00:00+02:00"),
      make("soon", "2026-05-11T18:00:00+02:00", "2026-05-11T20:00:00+02:00"),
    ]
    expect(findNextEvent(events, nowMs)?.id).toBe("soon")
  })

  it("returns undefined when nothing is in the future", () => {
    expect(findNextEvent([], nowMs)).toBeUndefined()
  })

  it("ignores events that have already ended", () => {
    const events = [
      make("past", "2026-05-08T18:00:00+02:00", "2026-05-08T20:00:00+02:00"),
    ]
    expect(findNextEvent(events, nowMs)).toBeUndefined()
  })
})
