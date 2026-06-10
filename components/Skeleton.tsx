// Loading placeholders shown while the store hydrates.

export function ListingCardSkeleton() {
  return (
    <div className="card p-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl bg-zinc-100 shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-20 bg-zinc-100 rounded-full" />
          <div className="h-4 w-3/4 bg-zinc-100 rounded" />
          <div className="h-4 w-1/3 bg-zinc-100 rounded" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-100 space-y-2">
        <div className="h-3 w-2/3 bg-zinc-100 rounded" />
        <div className="h-3 w-1/2 bg-zinc-100 rounded" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
