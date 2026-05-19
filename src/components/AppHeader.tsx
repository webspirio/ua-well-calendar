import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { PersonaPicker } from "./PersonaPicker"
import { currentUserId } from "@/lib/persona"
import { meQuery } from "@/lib/queries"

export function AppHeader() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  return (
    <header className="border-b px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-lg font-semibold">Calendar — demo</Link>
        {me?.is_admin && <Badge variant="secondary">Admin</Badge>}
      </div>
      <PersonaPicker />
    </header>
  )
}
