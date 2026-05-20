import { Skeleton } from "@/components/ui/skeleton"

export function EventCardSkeleton() {
  return (
    <article className="rounded-xl overflow-hidden border bg-card shadow-sm h-full flex flex-col">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between gap-2 pt-2 mt-auto">
          <Skeleton className="h-5 w-20" />
          <div className="flex -space-x-1.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  )
}
