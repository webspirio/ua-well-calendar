import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AvatarStack } from "@/components/AvatarStack"
import { EventCard } from "@/components/EventCard"
import { supabase } from "@/lib/supabase"
import { currentUserId } from "@/lib/persona"
import {
  allCommentsQuery,
  allRsvpsQuery,
  eventsQuery,
  meQuery,
  userQuery,
} from "@/lib/queries"
import { computeStats, userPastEvents, userRecentComments, userUpcomingEvents } from "@/lib/userStats"
import { formatCommentTime } from "@/lib/dates"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

export function Profile() {
  const { userId = "" } = useParams()
  const queryClient = useQueryClient()
  const viewerId = currentUserId()
  const { data: me } = useQuery(meQuery(viewerId))
  const { data: user, isLoading } = useQuery(userQuery(userId))
  const { data: events } = useQuery(eventsQuery())
  const { data: rsvps } = useQuery(allRsvpsQuery())
  const { data: comments } = useQuery(allCommentsQuery())

  const stats = useMemo(() => {
    if (!user || !events || !rsvps || !comments) return null
    return computeStats(user, { events, rsvps, comments })
  }, [user, events, rsvps, comments])

  const upcoming = useMemo(() => {
    if (!user || !events || !rsvps || !comments) return []
    return userUpcomingEvents(user, { events, rsvps, comments })
  }, [user, events, rsvps, comments])

  const past = useMemo(() => {
    if (!user || !events || !rsvps || !comments) return []
    return userPastEvents(user, { events, rsvps, comments })
  }, [user, events, rsvps, comments])

  const recentComments = useMemo(() => {
    if (!user || !events || !rsvps || !comments) return []
    return userRecentComments(user, { events, rsvps, comments }, 5)
  }, [user, events, rsvps, comments])

  const toggleAdmin = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from("users")
        .update({ is_admin: next })
        .eq("id", userId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["user", userId] })
      queryClient.invalidateQueries({ queryKey: ["me", userId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <p className="text-muted-foreground">{t.common.loading}</p>
  if (!user) return <p className="text-muted-foreground">{t.profile.notFound}</p>

  const eventById = new Map(events?.map((e) => [e.id, e]) ?? [])
  const isSelf = user.id === viewerId
  const viewerIsAdmin = !!me?.is_admin

  return (
    <article className="space-y-6">
      <header className="flex items-start gap-4">
        <div className="shrink-0">
          <AvatarStack users={[user]} max={1} size="md" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-tight truncate">
            {user.first_name ?? t.profile.headingFallback}
          </h1>
          {user.username && (
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {user.is_admin && <Badge variant="secondary">{t.app.adminBadge}</Badge>}
            <span className="text-xs text-muted-foreground">
              {t.members.memberSince(
                format(new Date(user.created_at), "LLLL yyyy", { locale: uk }),
              )}
            </span>
          </div>
        </div>
      </header>

      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <StatCard label={t.members.stats.upcoming} value={stats.upcomingCount} tone="emerald" />
          <StatCard label={t.members.stats.past}     value={stats.pastCount}     tone="default" />
          <StatCard label={t.members.stats.comments} value={stats.commentsCount} tone="sky" />
          <StatCard label={t.members.stats.cancelled} value={stats.cancelledCount} tone="rose" />
        </div>
      )}

      {stats?.lastActivityAt ? (
        <p className="text-xs text-muted-foreground">
          {t.members.lastActivity(formatCommentTime(stats.lastActivityAt))}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t.members.noLastActivity}</p>
      )}

      <Section heading={t.profile.upcoming}>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.profile.noUpcoming}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcoming.map((ev) => (
              <li key={ev.id} className="h-full">
                <Link to={`/event/${ev.id}`} className="block h-full">
                  <EventCard event={ev} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section heading={t.profile.past}>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.profile.noPast}</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {past.map((ev) => (
              <li key={ev.id} className="h-full">
                <Link to={`/event/${ev.id}`} className="block h-full">
                  <EventCard event={ev} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section heading={t.profile.recentComments}>
        {recentComments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.profile.noComments}</p>
        ) : (
          <ul className="space-y-2">
            {recentComments.map((c) => {
              const ev = eventById.get(c.event_id)
              return (
                <li key={c.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    {ev ? (
                      <Link
                        to={`/event/${ev.id}`}
                        className="font-medium text-xs text-foreground hover:underline truncate"
                      >
                        {ev.title}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatCommentTime(c.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-line leading-snug">{c.body}</p>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      {viewerIsAdmin && (
        <Section heading={t.profile.adminActions}>
          {isSelf && user.is_admin ? (
            <p className="text-sm text-muted-foreground">{t.profile.cannotDemoteSelf}</p>
          ) : user.is_admin ? (
            <Button
              variant="outline"
              onClick={() => toggleAdmin.mutate(false)}
              disabled={toggleAdmin.isPending}
            >
              {toggleAdmin.isPending ? t.profile.promoting : t.profile.demote}
            </Button>
          ) : (
            <Button
              onClick={() => toggleAdmin.mutate(true)}
              disabled={toggleAdmin.isPending}
            >
              {toggleAdmin.isPending ? t.profile.promoting : t.profile.promote}
            </Button>
          )}
        </Section>
      )}
    </article>
  )
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-t pt-4">
      <h2 className="text-base font-semibold">{heading}</h2>
      {children}
    </section>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "default" | "emerald" | "sky" | "rose" }) {
  const toneCls: Record<typeof tone, string> = {
    default: "text-foreground",
    emerald: "text-emerald-600",
    sky:     "text-sky-600",
    rose:    "text-rose-600",
  }
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className={cn("text-2xl font-semibold tabular-nums leading-none", toneCls[tone])}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}
