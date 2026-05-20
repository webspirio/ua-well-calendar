import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AttendanceSheet } from "@/components/AttendanceSheet"
import { EventComments } from "@/components/EventComments"
import { EventGoingList } from "@/components/EventGoingList"
import { supabase } from "@/lib/supabase"
import { currentUserId } from "@/lib/persona"
import { eventQuery, meQuery, rsvpsQuery, usersQuery } from "@/lib/queries"
import { formatEventWhen, isPast, isToday } from "@/lib/dates"
import { t } from "@/lib/strings"
import { announceEvent } from "@/lib/announce"
import { cn } from "@/lib/utils"

function imgSrc(rel: string): string {
  return `${import.meta.env.BASE_URL}${rel}`
}

export function EventDetail() {
  const { id = "" } = useParams()
  const userId = currentUserId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: event, isLoading } = useQuery(eventQuery(id))
  const { data: rsvps } = useQuery(rsvpsQuery(id))
  const { data: me } = useQuery(meQuery(userId))
  const { data: users } = useQuery(usersQuery())
  const speaker = event?.speaker_user_id
    ? users?.find((u) => u.id === event.speaker_user_id)
    : null

  const going = rsvps?.filter((r) => r.status === "going").length ?? 0
  const myRow = rsvps?.find((r) => r.user_id === userId)
  const isGoing = myRow?.status === "going"
  const past = event ? isPast(event.ends_at) : false

  const goingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("rsvp_going", { p_event_id: id, p_user_id: userId })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t.toast.rsvpDone)
      queryClient.invalidateQueries({ queryKey: ["rsvps", id] })
    },
    onError: (e: Error) => {
      if (e.message.toLowerCase().includes("event full")) {
        toast.error(t.toast.eventFull)
      } else {
        toast.error(e.message)
      }
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
    onSuccess: () => {
      toast.success(t.toast.rsvpCancelled)
      queryClient.invalidateQueries({ queryKey: ["rsvps", id] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t.toast.eventDeleted)
      queryClient.invalidateQueries({ queryKey: ["events"] })
      navigate("/")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const republishMutation = useMutation({
    mutationFn: async () => {
      const r = await announceEvent(id, userId)
      if (!r.ok) throw new Error(r.error)
    },
    onSuccess: () => {
      toast.success(t.toast.announceSent)
      queryClient.invalidateQueries({ queryKey: ["event", id] })
    },
    onError: (e: Error) => toast.error(`${t.toast.announceFailed}: ${e.message}`),
  })

  if (isLoading) return <p className="text-muted-foreground">{t.common.loading}</p>
  if (!event) return <p className="text-muted-foreground">{t.detail.notFound}</p>

  const typeMeta = t.types[event.type]

  function onDelete() {
    if (window.confirm(t.detail.deleteConfirm)) {
      deleteMutation.mutate()
    }
  }

  return (
    <article className="space-y-5">
      {event.image_url && (
        <div className="rounded-xl overflow-hidden border bg-muted">
          <img
            src={imgSrc(event.image_url)}
            alt={event.title}
            className={cn("w-full h-auto object-cover", past && "grayscale")}
          />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline">{typeMeta.emoji} {typeMeta.label}</Badge>
        {past && <Badge variant="secondary">{t.list.pastLabel}</Badge>}
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold leading-tight">{event.title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatEventWhen(event.starts_at, event.ends_at)}
        </p>
        {event.location && (
          <p className="text-sm text-muted-foreground">{event.location}</p>
        )}
        {speaker?.first_name && (
          <p className="text-sm font-medium text-foreground/90">
            {t.detail.speaker(speaker.first_name)}
          </p>
        )}
      </header>

      {event.description && (
        <p className="whitespace-pre-line text-sm text-foreground/90 leading-relaxed">
          {event.description}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {t.list.goingCount(going, event.capacity)}
        </Badge>
      </div>

      {!past && (
        <div className="flex flex-wrap gap-2 pt-2">
          {!isGoing ? (
            <Button
              onClick={() => goingMutation.mutate()}
              disabled={goingMutation.isPending}
            >
              {goingMutation.isPending ? t.common.loading : t.detail.going}
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t.common.loading : t.detail.cancelRsvp}
            </Button>
          )}
        </div>
      )}

      <EventGoingList eventId={id} speakerUserId={event.speaker_user_id} />
      {me?.is_admin && (past || isToday(event.starts_at, event.ends_at)) && (
        <AttendanceSheet eventId={id} />
      )}
      <EventComments eventId={id} />

      {me?.is_admin && (
        <div className="border-t pt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => republishMutation.mutate()}
            disabled={republishMutation.isPending}
          >
            {republishMutation.isPending ? t.detail.republishing : t.detail.republish}
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t.common.loading : t.detail.delete}
          </Button>
        </div>
      )}
    </article>
  )
}
