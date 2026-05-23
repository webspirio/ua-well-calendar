import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { allRsvpsQuery, type EventRow } from "@/lib/queries"
import { formatEventWhen, isPast } from "@/lib/dates"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type Props = {
  day: Date | null
  events: EventRow[]
  onOpenChange: (open: boolean) => void
}

export function DayEventsDialog({ day, events, onOpenChange }: Props) {
  const { data: rsvps } = useQuery(allRsvpsQuery())
  const open = day !== null && events.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {day ? format(day, "EEEE, d MMMM", { locale: uk }) : ""}
          </DialogTitle>
        </DialogHeader>
        <ul className="overflow-y-auto space-y-2 -mx-1 px-1">
          {events.map((ev) => {
            const going = rsvps
              ? rsvps.filter((r) => r.event_id === ev.id && r.status === "going").length
              : 0
            const past = isPast(ev.ends_at)
            const typeMeta = t.types[ev.type]
            return (
              <li key={ev.id}>
                <Link
                  to={`/event/${ev.id}`}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "block rounded-lg border bg-card p-3 hover:bg-accent transition",
                    past && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{typeMeta.emoji}</span>
                        <span>{typeMeta.label}</span>
                      </div>
                      <h4 className="font-medium text-sm leading-tight mt-0.5 line-clamp-2">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatEventWhen(ev.starts_at, ev.ends_at)}
                      </p>
                      {ev.location && (
                        <p className="text-xs text-muted-foreground truncate">
                          {ev.location}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {t.list.goingCount(going, ev.capacity)}
                    </Badge>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
