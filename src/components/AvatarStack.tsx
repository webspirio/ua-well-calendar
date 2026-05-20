import { cn } from "@/lib/utils"

type UserSummary = { id: string; first_name: string | null }

type Props = {
  users: UserSummary[]
  max?: number
  size?: "sm" | "md"
}

const PALETTE = [
  "bg-orange-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
]

function colorFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function initial(name: string | null): string {
  return name?.trim().slice(0, 1).toUpperCase() ?? "?"
}

export function AvatarStack({ users, max = 4, size = "sm" }: Props) {
  if (!users.length) return null
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  const dim = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"

  return (
    <div className="flex items-center">
      <div className="flex -space-x-1.5">
        {shown.map((u) => (
          <div
            key={u.id}
            title={u.first_name ?? ""}
            className={cn(
              "rounded-full ring-2 ring-background flex items-center justify-center font-medium text-white",
              dim,
              colorFor(u.id),
            )}
          >
            {initial(u.first_name)}
          </div>
        ))}
        {extra > 0 && (
          <div
            className={cn(
              "rounded-full ring-2 ring-background bg-muted text-muted-foreground flex items-center justify-center font-medium",
              dim,
            )}
          >
            +{extra}
          </div>
        )}
      </div>
    </div>
  )
}
