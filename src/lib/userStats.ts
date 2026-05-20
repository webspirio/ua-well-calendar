import type { CommentRow, EventRow, RsvpRow, UserRow } from "./queries"
import { isPast } from "./dates"

export type UserStats = {
  user: UserRow
  upcomingCount: number
  pastCount: number
  cancelledCount: number
  commentsCount: number
  lastActivityAt: string | null
  engagementScore: number
}

export type StatsContext = {
  events: EventRow[]
  rsvps: RsvpRow[]
  comments: CommentRow[]
}

function buildEventMap(events: EventRow[]): Map<string, EventRow> {
  return new Map(events.map((e) => [e.id, e]))
}

export function computeStats(user: UserRow, ctx: StatsContext): UserStats {
  const events = buildEventMap(ctx.events)
  let upcoming = 0
  let past = 0
  let cancelled = 0
  let lastActivity: number | null = null

  for (const r of ctx.rsvps) {
    if (r.user_id !== user.id) continue
    if (r.status === "cancelled") {
      cancelled += 1
      continue
    }
    const ev = events.get(r.event_id)
    if (!ev) continue
    if (isPast(ev.ends_at)) past += 1
    else upcoming += 1
    const t = new Date(ev.starts_at).getTime()
    if (lastActivity === null || t > lastActivity) lastActivity = t
  }

  let commentsCount = 0
  for (const c of ctx.comments) {
    if (c.user_id !== user.id) continue
    commentsCount += 1
    const t = new Date(c.created_at).getTime()
    if (lastActivity === null || t > lastActivity) lastActivity = t
  }

  const engagementScore = upcoming * 2 + past + commentsCount

  return {
    user,
    upcomingCount: upcoming,
    pastCount: past,
    cancelledCount: cancelled,
    commentsCount,
    lastActivityAt: lastActivity ? new Date(lastActivity).toISOString() : null,
    engagementScore,
  }
}

export function computeAllStats(
  users: UserRow[],
  ctx: StatsContext,
): UserStats[] {
  return users.map((u) => computeStats(u, ctx))
}

export function userUpcomingEvents(user: UserRow, ctx: StatsContext): EventRow[] {
  const goingEventIds = new Set(
    ctx.rsvps.filter((r) => r.user_id === user.id && r.status === "going").map((r) => r.event_id),
  )
  return ctx.events
    .filter((e) => goingEventIds.has(e.id) && !isPast(e.ends_at))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
}

export function userPastEvents(user: UserRow, ctx: StatsContext): EventRow[] {
  const goingEventIds = new Set(
    ctx.rsvps.filter((r) => r.user_id === user.id && r.status === "going").map((r) => r.event_id),
  )
  return ctx.events
    .filter((e) => goingEventIds.has(e.id) && isPast(e.ends_at))
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
}

export function userRecentComments(user: UserRow, ctx: StatsContext, limit = 5): CommentRow[] {
  return ctx.comments
    .filter((c) => c.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
}
