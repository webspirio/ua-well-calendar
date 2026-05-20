import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, Navigate } from "react-router"
import { format } from "date-fns"
import { uk } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AvatarStack } from "@/components/AvatarStack"
import { currentUserId } from "@/lib/persona"
import {
  allCommentsQuery,
  allRsvpsQuery,
  eventsQuery,
  meQuery,
  usersQuery,
} from "@/lib/queries"
import { computeAllStats } from "@/lib/userStats"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"

type SortMode = "activity" | "name" | "recent"

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "activity", label: t.members.sortActivity },
  { value: "name",     label: t.members.sortName },
  { value: "recent",   label: t.members.sortRecent },
]

export function AdminMembers() {
  const { data: me, isLoading: meLoading } = useQuery(meQuery(currentUserId()))
  const { data: users } = useQuery(usersQuery())
  const { data: events } = useQuery(eventsQuery())
  const { data: rsvps } = useQuery(allRsvpsQuery())
  const { data: comments } = useQuery(allCommentsQuery())

  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortMode>("activity")
  const [adminsOnly, setAdminsOnly] = useState(false)

  const allStats = useMemo(() => {
    if (!users || !events || !rsvps || !comments) return []
    return computeAllStats(users, { events, rsvps, comments })
  }, [users, events, rsvps, comments])

  const filtered = useMemo(() => {
    let list = allStats
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.user.first_name?.toLowerCase().includes(q) ||
          s.user.username?.toLowerCase().includes(q),
      )
    }
    if (adminsOnly) list = list.filter((s) => s.user.is_admin)
    const sorted = [...list]
    if (sort === "activity") {
      sorted.sort((a, b) => b.engagementScore - a.engagementScore)
    } else if (sort === "name") {
      sorted.sort((a, b) =>
        (a.user.first_name ?? "").localeCompare(b.user.first_name ?? "", "uk"),
      )
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.user.created_at).getTime() - new Date(a.user.created_at).getTime(),
      )
    }
    return sorted
  }, [allStats, query, adminsOnly, sort])

  if (meLoading) return <p className="text-muted-foreground">{t.common.loading}</p>
  if (!me?.is_admin) return <Navigate to="/" replace />

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {t.members.headingCount(users?.length ?? 0)}
      </h2>

      <div className="space-y-3">
        <Input
          placeholder={t.members.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t.members.sortLabel}</span>
          {SORT_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant={sort === opt.value ? "default" : "outline"}
              size="sm"
              className="h-7 px-3"
              onClick={() => setSort(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          <Button
            type="button"
            variant={adminsOnly ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 ml-auto"
            onClick={() => setAdminsOnly((v) => !v)}
          >
            {t.members.showAdminsOnly}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">{t.members.empty}</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li key={s.user.id}>
              <Link
                to={`/profile/${s.user.id}`}
                className="block rounded-lg border bg-card p-3 hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AvatarStack users={[s.user]} max={1} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {s.user.first_name ?? "—"}
                      </span>
                      {s.user.is_admin && (
                        <Badge variant="secondary" className="h-5 text-[10px]">
                          {t.app.adminBadge}
                        </Badge>
                      )}
                    </div>
                    {s.user.username && (
                      <div className="text-xs text-muted-foreground truncate">
                        @{s.user.username}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {t.members.memberSince(
                        format(new Date(s.user.created_at), "LLLL yyyy", { locale: uk }),
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-0 text-right text-xs shrink-0">
                    <StatMini label={t.members.stats.upcoming} value={s.upcomingCount} accent="emerald" />
                    <StatMini label={t.members.stats.past}     value={s.pastCount}     accent="muted" />
                    <StatMini label={t.members.stats.comments} value={s.commentsCount} accent="sky" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatMini({ label, value, accent }: { label: string; value: number; accent: "emerald" | "muted" | "sky" }) {
  const colors: Record<typeof accent, string> = {
    emerald: "text-emerald-600",
    muted:   "text-muted-foreground",
    sky:     "text-sky-600",
  }
  return (
    <div>
      <div className={cn("font-semibold tabular-nums", colors[accent])}>{value}</div>
      <div className="text-muted-foreground text-[10px] leading-tight">{label}</div>
    </div>
  )
}
