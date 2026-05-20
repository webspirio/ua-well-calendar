import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const URL = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321"
const KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!KEY) {
  throw new Error("VITE_SUPABASE_ANON_KEY must be set (run `npx supabase status` and put it in .env.local)")
}

const supabase: SupabaseClient = createClient(URL, KEY)

const CAPACITY = 5
const CONCURRENCY = 20

let creatorId: string
let eventId: string
const userIds: string[] = []

beforeAll(async () => {
  // Reuse the seeded admin as creator (UUID hardcoded in seed.sql).
  creatorId = "00000000-0000-0000-0000-000000000001"

  // Create 20 throwaway race-test users with tg_id 90000+i to avoid colliding
  // with the seeded personas (111/222/333) or any real Telegram user.
  const tgBase = 90_000 + Math.floor(Math.random() * 100_000)
  const rows = Array.from({ length: CONCURRENCY }, (_, i) => ({
    tg_id: tgBase + i,
    username: `race_${tgBase + i}`,
    first_name: `Race ${i}`,
  }))
  const { data: created, error: cErr } = await supabase
    .from("users")
    .insert(rows)
    .select("id")
  if (cErr) throw cErr
  userIds.push(...created.map((u) => u.id))

  // Create a fresh event with capacity = 5 in the far future so it never
  // collides visually with the demo calendar.
  const starts = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
  const ends = new Date(Date.now() + 365 * 24 * 3600 * 1000 + 3600 * 1000).toISOString()
  const { data: ev, error: eErr } = await supabase
    .from("events")
    .insert({
      creator_id: creatorId,
      title: `[race-test ${tgBase}]`,
      starts_at: starts,
      ends_at: ends,
      capacity: CAPACITY,
      type: "offline",
    })
    .select("id")
    .single()
  if (eErr) throw eErr
  eventId = ev.id
})

afterAll(async () => {
  if (eventId) await supabase.from("events").delete().eq("id", eventId)
  if (userIds.length) await supabase.from("users").delete().in("id", userIds)
})

describe("rsvp_going race", () => {
  it(`exactly ${CAPACITY} of ${CONCURRENCY} parallel RSVPs succeed`, async () => {
    const calls = userIds.map((uid) =>
      supabase.rpc("rsvp_going", { p_event_id: eventId, p_user_id: uid }),
    )
    const results = await Promise.allSettled(calls)

    const successes = results.filter(
      (r) => r.status === "fulfilled" && !(r.value as { error?: unknown }).error,
    ).length
    const failures = results.length - successes

    const errorMessages = results
      .filter((r): r is PromiseFulfilledResult<{ error?: { message?: string } | null }> =>
        r.status === "fulfilled" && !!r.value.error,
      )
      .map((r) => r.value.error!.message ?? "")

    expect(successes).toBe(CAPACITY)
    expect(failures).toBe(CONCURRENCY - CAPACITY)
    expect(errorMessages.every((m) => m.toLowerCase().includes("event full"))).toBe(true)

    // Verify DB state matches: exactly CAPACITY 'going' rows.
    const { count } = await supabase
      .from("rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "going")
    expect(count).toBe(CAPACITY)
  })
})
