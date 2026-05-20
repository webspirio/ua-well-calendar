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
