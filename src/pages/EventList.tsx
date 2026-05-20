import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { buttonVariants } from "@/components/ui/button"
import { EventCard } from "@/components/EventCard"
import { EventFilters, type TimeFilter, type TypeFilter } from "@/components/EventFilters"
import { NextUpHero } from "@/components/NextUpHero"
import { currentUserId } from "@/lib/persona"
import { allRsvpsQuery, eventsQuery, meQuery } from "@/lib/queries"
import { filterMine } from "@/lib/eventBadges"
import { isPast } from "@/lib/dates"
import { t } from "@/lib/strings"

export function EventList() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  const { data: events, isLoading, error } = useQuery(eventsQuery())
  const { data: allRsvps } = useQuery(allRsvpsQuery())
  const [time, setTime] = useState<TimeFilter>("upcoming")
  const [type, setType] = useState<TypeFilter>("all")

  const filtered = useMemo(() => {
    if (!events) return []
    let base = events
    if (time === "mine" && me) {
      base = filterMine(events, allRsvps ?? [], me.id)
    }
    return base.filter((ev) => {
      if (type !== "all" && ev.type !== type) return false
      if (time === "mine") return true
      const past = isPast(ev.ends_at)
      if (time === "upcoming" && past) return false
      if (time === "past" && !past) return false
      return true
    })
  }, [events, time, type, allRsvps, me])

  if (isLoading) return <p className="text-muted-foreground">{t.list.loading}</p>
  if (error) return <p className="text-muted-foreground">{t.common.error}</p>
  if (!events?.length) return <p className="text-muted-foreground">{t.list.empty}</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t.list.heading}</h2>
        {me?.is_admin && (
          <Link to="/admin/new" className={buttonVariants()}>
            {t.list.newEvent}
          </Link>
        )}
      </div>
      {time !== "past" && time !== "mine" && <NextUpHero events={events} />}
      <EventFilters
        time={time}
        type={type}
        onTimeChange={setTime}
        onTypeChange={setType}
      />
      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {time === "mine" ? t.list.emptyMine : t.list.emptyFiltered}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((ev) => (
            <li key={ev.id} className="h-full">
              <Link to={`/event/${ev.id}`} className="block h-full">
                <EventCard event={ev} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
