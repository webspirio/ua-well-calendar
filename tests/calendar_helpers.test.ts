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
