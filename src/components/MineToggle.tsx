import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { t } from "@/lib/strings"

type Props = {
  value: boolean
  onChange: (v: boolean) => void
}

export function MineToggle({ value, onChange }: Props) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Label htmlFor="mine-toggle" className="text-sm text-muted-foreground">
        {t.calendar.mineToggle}
      </Label>
      <Switch
        id="mine-toggle"
        checked={value}
        onCheckedChange={onChange}
      />
    </div>
  )
}
