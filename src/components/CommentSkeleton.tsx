import { Skeleton } from "@/components/ui/skeleton"

export function CommentSkeleton() {
  return (
    <li className="flex gap-2.5">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 rounded-lg bg-muted px-3 py-2 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </li>
  )
}
