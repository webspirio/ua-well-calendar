import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { format } from "date-fns"
import { buttonVariants } from "@/components/ui/button"
import { EventCard } from "@/components/EventCard"
import { EventCardSkeleton } from "@/components/EventCardSkeleton"
import { EventCalendar } from "@/components/EventCalendar"
import { DayEventsDialog } from "@/components/DayEventsDialog"
import { MineToggle } from "@/components/MineToggle"
import { EventFilters, type TypeFilter } from "@/components/EventFilters"
import { NextUpHero } from "@/components/NextUpHero"
import { currentUserId } from "@/lib/persona"
import { allRsvpsQuery, eventsQuery, meQuery, type EventType } from "@/lib/queries"
import { filterMine } from "@/lib/eventBadges"
import {
  eventsInMonth,
  eventsOnDay,
  eventTypesOnDay,
  now,
} from "@/lib/dates"
import { t } from "@/lib/strings"

export function EventList() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  const { data: events, isLoading, error } = useQuery(eventsQuery())
  const { data: allRsvps } = useQuery(allRsvpsQuery())

  const [month, setMonth] = useState<Date>(now())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [mineOnly, setMineOnly] = useState(false)
  const [type, setType] = useState<TypeFilter>("all")

  const visibleEvents = useMemo(() => {
    if (!events) return []
    let base = events
    if (mineOnly && me) base = filterMine(events, allRsvps ?? [], me.id)
    if (type !== "all") base = base.filter((ev) => ev.type === type)
    return base
  }, [events, mineOnly, type, allRsvps, me])

  const monthEvents = useMemo(
    () => eventsInMonth(visibleEvents, month),
    [visibleEvents, month],
  )

  const dayEvents = useMemo(
    () => (selectedDay ? eventsOnDay(visibleEvents, selectedDay) : []),
    [visibleEvents, selectedDay],
  )

  const daysWithEvents = useMemo(() => {
    const map = new Map<string, Set<EventType>>()
    for (const ev of monthEvents) {
      const start = new Date(ev.starts_at)
      const end = new Date(ev.ends_at)
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      const stopMs = end.getTime()
      while (cursor.getTime() <= stopMs) {
        const types = eventTypesOnDay(visibleEvents, cursor)
        if (types.size > 0) {
          map.set(format(cursor, "yyyy-MM-dd"), types)
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [monthEvents, visibleEvents])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <EventCardSkeleton />
      </div>
    )
  }
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

      {!mineOnly && <NextUpHero events={events} />}

      <MineToggle value={mineOnly} onChange={setMineOnly} />

      <EventCalendar
        month={month}
        selectedDay={selectedDay}
        daysWithEvents={daysWithEvents}
        onMonthChange={setMonth}
        onDayPick={setSelectedDay}
      />

      <EventFilters type={type} onTypeChange={setType} />

      {monthEvents.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {mineOnly ? t.list.emptyMine : t.calendar.monthEmpty}
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {monthEvents.map((ev) => (
            <li key={ev.id} className="h-full">
              <Link to={`/event/${ev.id}`} className="block h-full">
                <EventCard event={ev} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <DayEventsDialog
        day={selectedDay}
        events={dayEvents}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null)
        }}
      />
    </div>
  )
}
