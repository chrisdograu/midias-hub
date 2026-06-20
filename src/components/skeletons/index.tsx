import { Skeleton } from '@/components/ui/skeleton';

export function GameCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[3/4] w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function GameCardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => <GameCardSkeleton key={i} />)}
    </div>
  );
}

export function FeedItemSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-card/40">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function RadarSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-44 shrink-0 space-y-2">
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OpportunityRowSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-48" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0">
            <Skeleton className="aspect-[3/4] w-full rounded-lg mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ol className="relative border-l border-border ml-3 space-y-4 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="ml-4">
          <span className="absolute -left-2 w-4 h-4 rounded-full bg-muted ring-4 ring-background" />
          <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
            <Skeleton className="w-10 h-10 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-60" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
      </div>
      <GameCardGridSkeleton count={6} />
    </div>
  );
}
