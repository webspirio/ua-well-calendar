import { Button } from "@/components/ui/button"
import { t } from "@/lib/strings"
import type { EventType } from "@/lib/queries"

export type TypeFilter = "all" | EventType

type Props = {
  type: TypeFilter
  onTypeChange: (v: TypeFilter) => void
}

export function EventFilters({ type, onTypeChange }: Props) {
  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "all",     label: t.filters.typeAll },
    { value: "offline", label: t.admin.types.offline },
    { value: "online",  label: t.admin.types.online },
    { value: "trip",    label: t.admin.types.trip },
  ]

  return (
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
  )
}
