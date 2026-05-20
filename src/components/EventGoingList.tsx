import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { rsvpsQuery, usersQuery } from "@/lib/queries"
import { AvatarStack } from "./AvatarStack"
import { t } from "@/lib/strings"

type Props = { eventId: string }

export function EventGoingList({ eventId }: Props) {
  const { data: rsvps } = useQuery(rsvpsQuery(eventId))
  const { data: users } = useQuery(usersQuery())

  const goingUsers = useMemo(() => {
    if (!rsvps || !users) return []
    const byId = new Map(users.map((u) => [u.id, u]))
    return rsvps
      .filter((r) => r.status === "going")
      .map((r) => byId.get(r.user_id))
      .filter((u): u is NonNullable<typeof u> => !!u)
  }, [rsvps, users])

  return (
    <section className="space-y-3 border-t pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          {t.detail.rsvpsHeading} · {goingUsers.length}
        </h2>
        <AvatarStack users={goingUsers.slice(0, 6)} max={6} size="md" />
      </div>
      {goingUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.detail.rsvpsEmpty}</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {goingUsers.map((u) => (
            <li key={u.id} className="min-w-0">
              <Link
                to={`/profile/${u.id}`}
                className="flex items-center gap-2 min-w-0 rounded-md px-1 py-0.5 hover:bg-accent/40 transition-colors"
              >
                <AvatarStack users={[u]} max={1} size="sm" />
                <span className="truncate">{u.first_name ?? "—"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
