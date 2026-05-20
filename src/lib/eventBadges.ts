import type { EventRow, RsvpRow } from "./queries"

export type Hotness = "almost-full" | "full" | null

export function hotness(going: number, capacity: number, past: boolean): Hotness {
  if (past) return null
  const ratio = going / capacity
  if (ratio >= 1) return "full"
  if (ratio >= 0.75) return "almost-full"
  return null
}

export function filterMine(events: EventRow[], rsvps: RsvpRow[], userId: string): EventRow[] {
  const mine = new Set(
    rsvps
      .filter((r) => r.user_id === userId && r.status === "going")
      .map((r) => r.event_id),
  )
  return events.filter((ev) => mine.has(ev.id))
}

export function findNextEvent(events: EventRow[], nowMs: number): EventRow | undefined {
  let best: EventRow | undefined
  let bestMs = Infinity
  for (const ev of events) {
    const startMs = new Date(ev.starts_at).getTime()
    const endMs = new Date(ev.ends_at).getTime()
    if (startMs <= nowMs || endMs <= nowMs) continue
    if (startMs < bestMs) {
      bestMs = startMs
      best = ev
    }
  }
  return best
}
