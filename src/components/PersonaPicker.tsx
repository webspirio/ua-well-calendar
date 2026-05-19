import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { currentUserId, PERSONAS, setCurrentUserId } from "@/lib/persona"

export function PersonaPicker() {
  const value = currentUserId()
  return (
    <Select value={value} onValueChange={(v) => v && setCurrentUserId(v)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERSONAS.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
