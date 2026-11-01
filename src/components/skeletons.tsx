import { Skeleton } from '@/components/ui/skeleton';

export function ReportCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ReportCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5" aria-hidden="true">
      <Skeleton className="h-4 w-28" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <Skeleton className="aspect-[16/9] w-full rounded-none" />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-4 w-2/5" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-3 pt-3">
            <Skeleton className="h-12 w-full rounded-xl sm:w-40" />
            <Skeleton className="h-12 w-full rounded-xl sm:w-40" />
          </div>
        </div>
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
    </div>
  );
}

export function MyReportsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <ReportCardSkeleton key={index} />
      ))}
    </div>
  );
}
