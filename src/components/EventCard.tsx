import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { AvatarStack } from "./AvatarStack"
import { rsvpsQuery, usersQuery, type EventRow } from "@/lib/queries"
import { formatEventWhen, isPast, isToday, daysUntil } from "@/lib/dates"
import { hotness } from "@/lib/eventBadges"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type Props = { event: EventRow }

const TYPE_GRADIENT: Record<EventRow["type"], string> = {
  offline: "from-orange-500/30 to-orange-700/50",
  online:  "from-emerald-500/30 to-emerald-700/50",
  trip:    "from-sky-500/30 to-sky-700/50",
}

function imgSrc(rel: string): string {
  return `${import.meta.env.BASE_URL}${rel}`
}

export function EventCard({ event }: Props) {
  const { data: rsvps } = useQuery(rsvpsQuery(event.id))
  const { data: users } = useQuery(usersQuery())

  const goingUsers = useMemo(() => {
    if (!rsvps || !users) return []
    const byId = new Map(users.map((u) => [u.id, u]))
    return rsvps
      .filter((r) => r.status === "going")
      .map((r) => byId.get(r.user_id))
      .filter((u): u is NonNullable<typeof u> => !!u)
  }, [rsvps, users])

  const going = goingUsers.length
  const past = isPast(event.ends_at)
  const heat = hotness(going, event.capacity, past)
  const today = isToday(event.starts_at, event.ends_at)
  const tomorrow = daysUntil(event.starts_at) === 1
  const typeEmoji = t.types[event.type].emoji
  const typeLabel = t.types[event.type].label

  return (
    <article
      className={cn(
        "group rounded-xl overflow-hidden border bg-card shadow-sm transition hover:shadow-md h-full flex flex-col",
        past && "opacity-70",
      )}
    >
      <div className="relative aspect-[4/5] bg-muted overflow-hidden">
        {event.image_url ? (
          <img
            src={imgSrc(event.image_url)}
            alt={event.title}
            className={cn(
              "h-full w-full object-cover",
              past && "grayscale",
            )}
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "h-full w-full flex items-center justify-center bg-gradient-to-br text-5xl",
              TYPE_GRADIENT[event.type],
            )}
          >
            <span>{typeEmoji}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {past && (
            <Badge
              variant="secondary"
              className="bg-background/90 backdrop-blur"
            >
              {t.list.pastLabel}
            </Badge>
          )}
          {today && !past && (
            <Badge className="bg-rose-500 hover:bg-rose-500 text-white">
              {t.list.todayLabel}
            </Badge>
          )}
          {tomorrow && !today && !past && (
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
              {t.list.tomorrowLabel}
            </Badge>
          )}
        </div>
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 bg-background/90 backdrop-blur"
        >
          {typeEmoji} {typeLabel}
        </Badge>
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-base leading-tight line-clamp-2">
          {event.title}
        </h3>
        <div className="text-sm text-muted-foreground">
          {formatEventWhen(event.starts_at, event.ends_at)}
        </div>
        {event.location && (
          <div className="text-sm text-muted-foreground truncate">
            {event.location}
          </div>
        )}
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
      </div>
    </article>
  )
}
