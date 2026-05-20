import { Button } from "@/components/ui/button"
import { t } from "@/lib/strings"
import { cn } from "@/lib/utils"
import type { EventType } from "@/lib/queries"

export type TimeFilter = "all" | "upcoming" | "past" | "mine"
export type TypeFilter = "all" | EventType

type Props = {
  time: TimeFilter
  type: TypeFilter
  onTimeChange: (v: TimeFilter) => void
  onTypeChange: (v: TypeFilter) => void
}

export function EventFilters({ time, type, onTimeChange, onTypeChange }: Props) {
  const timeOptions: { value: TimeFilter; label: string }[] = [
    { value: "upcoming", label: t.filters.timeUpcoming },
    { value: "past",     label: t.filters.timePast },
    { value: "mine",     label: t.filters.timeMine },
    { value: "all",      label: t.filters.timeAll },
  ]
  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "all",     label: t.filters.typeAll },
    { value: "offline", label: t.admin.types.offline },
    { value: "online",  label: t.admin.types.online },
    { value: "trip",    label: t.admin.types.trip },
  ]

  return (
    <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-b space-y-2">
      <div className="flex gap-1 rounded-md bg-muted p-1 w-fit text-sm">
        {timeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onTimeChange(opt.value)}
            className={cn(
              "px-3 py-1 rounded transition-colors",
              time === opt.value
                ? "bg-background shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {typeOptions.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={type === opt.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-3"
            onClick={() => onTypeChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
