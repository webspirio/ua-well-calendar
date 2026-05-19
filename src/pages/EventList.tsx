import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { currentUserId } from "@/lib/persona"
import { eventsQuery, meQuery, rsvpsQuery } from "@/lib/queries"

export function EventList() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  const { data: events, isLoading } = useQuery(eventsQuery())

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!events?.length) return <p className="text-muted-foreground">No upcoming events.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upcoming events</h2>
        {me?.is_admin && (
          <Link to="/admin/new" className={buttonVariants()}>+ New event</Link>
        )}
      </div>
      <ul className="space-y-3">
        {events.map((ev) => (
          <li key={ev.id}>
            <Link to={`/event/${ev.id}`}>
              <EventCard event={ev} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EventCard({ event }: { event: { id: string; title: string; starts_at: string; location: string | null; capacity: number } }) {
  const { data: rsvps } = useQuery(rsvpsQuery(event.id))
  const going = rsvps?.filter((r) => r.status === "going").length ?? 0
  return (
    <Card className="hover:bg-accent/40 transition-colors">
      <CardHeader>
        <CardTitle className="text-base">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <div>{format(new Date(event.starts_at), "EEE d MMM, HH:mm")}</div>
        {event.location && <div>{event.location}</div>}
        <Badge variant="secondary">{going} / {event.capacity} going</Badge>
      </CardContent>
    </Card>
  )
}
