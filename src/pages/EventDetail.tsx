import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router"
import { format } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { currentUserId } from "@/lib/persona"
import { eventQuery, rsvpsQuery } from "@/lib/queries"

export function EventDetail() {
  const { id = "" } = useParams()
  const userId = currentUserId()
  const queryClient = useQueryClient()
  const { data: event, isLoading } = useQuery(eventQuery(id))
  const { data: rsvps } = useQuery(rsvpsQuery(id))

  const going = rsvps?.filter((r) => r.status === "going").length ?? 0
  const myRow = rsvps?.find((r) => r.user_id === userId)
  const isGoing = myRow?.status === "going"

  const goingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("rsvp_going", { p_event_id: id, p_user_id: userId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rsvps", id] }),
    onError: (e: Error) => {
      if (e.message.includes("event full")) toast.error("Event is full")
      else toast.error(e.message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rsvps")
        .update({ status: "cancelled" })
        .eq("event_id", id)
        .eq("user_id", userId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rsvps", id] }),
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!event) return <p className="text-muted-foreground">Event not found.</p>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{event.title}</CardTitle>
          <Badge variant="outline">{event.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-muted-foreground">
          {format(new Date(event.starts_at), "EEE d MMM yyyy, HH:mm")}
          {" – "}
          {format(new Date(event.ends_at), "HH:mm")}
        </div>
        {event.location && <div>{event.location}</div>}
        {event.description && <p className="text-foreground/80">{event.description}</p>}
        <div>
          <Badge variant="secondary">{going} / {event.capacity} going</Badge>
        </div>
        <div className="flex gap-2 pt-2">
          {!isGoing ? (
            <Button onClick={() => goingMutation.mutate()} disabled={goingMutation.isPending}>
              {goingMutation.isPending ? "…" : "Going"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "…" : "Cancel RSVP"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
