import { format } from "date-fns"
import { uk } from "date-fns/locale"
import type { DayButtonProps } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { EventType } from "@/lib/queries"

type Props = {
  month: Date
  selectedDay: Date | null
  daysWithEvents: Map<string, Set<EventType>>
  onMonthChange: (d: Date) => void
  onDayPick: (d: Date) => void
}

const DOT_CLASS: Record<EventType, string> = {
  offline: "bg-orange-500",
  online: "bg-emerald-500",
  trip: "bg-sky-500",
}

const DOT_ORDER: EventType[] = ["offline", "online", "trip"]

function makeDayButton(daysWithEvents: Map<string, Set<EventType>>) {
  return function DayButton({ day, modifiers, className, ...props }: DayButtonProps) {
    const key = format(day.date, "yyyy-MM-dd")
    const types = daysWithEvents.get(key)
    return (
      <button
        type="button"
        {...props}
        className={cn(
          "relative flex aspect-square w-full flex-col items-center justify-center rounded-md text-sm transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          modifiers.today && !modifiers.selected && "bg-muted/60 font-medium",
          modifiers.selected && "bg-primary text-primary-foreground hover:bg-primary",
          modifiers.outside && !modifiers.selected && "text-muted-foreground/50",
          modifiers.disabled && "text-muted-foreground/30 cursor-not-allowed",
          className,
        )}
      >
        <span className="leading-none">{day.date.getDate()}</span>
        {types && types.size > 0 && (
          <span className="absolute bottom-1 flex gap-0.5">
            {DOT_ORDER.filter((tt) => types.has(tt)).map((tt) => (
              <span
                key={tt}
                className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[tt])}
              />
            ))}
          </span>
        )}
      </button>
    )
  }
}

export function EventCalendar({
  month,
  selectedDay,
  daysWithEvents,
  onMonthChange,
  onDayPick,
}: Props) {
  return (
    <Calendar
      mode="single"
      locale={uk}
      weekStartsOn={1}
      month={month}
      onMonthChange={onMonthChange}
      selected={selectedDay ?? undefined}
      onSelect={(d) => {
        if (d) onDayPick(d)
      }}
      showOutsideDays
      className="mx-auto w-full max-w-sm"
      components={{
        DayButton: makeDayButton(daysWithEvents),
      }}
    />
  )
}
