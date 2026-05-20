import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { PersonaPicker } from "./PersonaPicker"
import { currentUserId } from "@/lib/persona"
import { isTelegramLaunch } from "@/lib/launch"
import { meQuery } from "@/lib/queries"
import { t } from "@/lib/strings"

export function AppHeader() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  const inTelegram = isTelegramLaunch()
  return (
    <header className="border-b px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Link to="/" className="text-lg font-semibold truncate">{t.app.title}</Link>
        {me?.is_admin && <Badge variant="secondary">{t.app.adminBadge}</Badge>}
      </div>
      <div className="flex items-center gap-2">
        {me?.is_admin && (
          <Link
            to="/admin/members"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t.members.navLink}
          </Link>
        )}
        {!inTelegram && <PersonaPicker />}
      </div>
    </header>
  )
}
