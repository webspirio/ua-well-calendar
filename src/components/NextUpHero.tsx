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
