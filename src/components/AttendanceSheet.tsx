import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { AvatarStack } from "./AvatarStack"
import { rsvpsQuery, usersQuery } from "@/lib/queries"
import { supabase } from "@/lib/supabase"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type Props = { eventId: string }

export function AttendanceSheet({ eventId }: Props) {
  const queryClient = useQueryClient()
  const { data: rsvps } = useQuery(rsvpsQuery(eventId))
  const { data: users } = useQuery(usersQuery())

  const goingRows = useMemo(() => {
    if (!rsvps || !users) return []
    const byId = new Map(users.map((u) => [u.id, u]))
    return rsvps
      .filter((r) => r.status === "going")
      .map((r) => ({ rsvp: r, user: byId.get(r.user_id) }))
      .filter(
        (row): row is { rsvp: typeof row.rsvp; user: NonNullable<typeof row.user> } =>
          !!row.user,
      )
  }, [rsvps, users])

  const attendedYes = goingRows.filter((row) => row.rsvp.attended === true).length

  const setAttended = useMutation({
    mutationFn: async (vars: { userId: string; value: boolean | null }) => {
      const { error } = await supabase
        .from("rsvps")
        .update({ attended: vars.value })
        .eq("event_id", eventId)
        .eq("user_id", vars.userId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t.toast.attendanceSaved)
      queryClient.invalidateQueries({ queryKey: ["rsvps", eventId] })
    },
    onError: (e: Error) => toast.error(`${t.toast.attendanceFailed}: ${e.message}`),
  })

  if (goingRows.length === 0) return null

  return (
    <section className="space-y-3 border-t pt-5">
      <h2 className="text-base font-semibold">
        {t.detail.attendanceHeading(attendedYes, goingRows.length)}
      </h2>
      <ul className="space-y-2">
        {goingRows.map(({ rsvp, user }) => (
          <li key={user.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AvatarStack
                users={[{ id: user.id, first_name: user.first_name }]}
                max={1}
                size="sm"
              />
              <span className="truncate text-sm">{user.first_name ?? "—"}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <ToggleBtn
                active={rsvp.attended === true}
                label={t.detail.attendedYes}
                variant="yes"
                onClick={() =>
                  setAttended.mutate({
                    userId: user.id,
                    value: rsvp.attended === true ? null : true,
                  })
                }
              />
              <ToggleBtn
                active={rsvp.attended === false}
                label={t.detail.attendedNo}
                variant="no"
                onClick={() =>
                  setAttended.mutate({
                    userId: user.id,
                    value: rsvp.attended === false ? null : false,
                  })
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ToggleBtn({
  active,
  label,
  variant,
  onClick,
}: {
  active: boolean
  label: string
  variant: "yes" | "no"
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 text-xs",
        active && variant === "yes" && "bg-emerald-600 hover:bg-emerald-600/90",
        active && variant === "no" && "bg-rose-600 hover:bg-rose-600/90",
      )}
    >
      {label}
    </Button>
  )
}
