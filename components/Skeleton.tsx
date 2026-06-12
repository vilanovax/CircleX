// Loading placeholders shown while the store hydrates.

const bone = "bg-zinc-100 dark:bg-zinc-800";

export function ListingCardSkeleton() {
  return (
    <div className="card p-3 animate-pulse">
      <div className="flex gap-3">
        <div className={`w-20 h-20 rounded-xl ${bone} shrink-0`} />
        <div className="flex-1 space-y-2 py-1">
          <div className={`h-3 w-20 ${bone} rounded-full`} />
          <div className={`h-4 w-3/4 ${bone} rounded`} />
          <div className={`h-4 w-1/3 ${bone} rounded`} />
        </div>
      </div>
      <div className={`mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2`}>
        <div className={`h-3 w-2/3 ${bone} rounded`} />
        <div className={`h-3 w-1/2 ${bone} rounded`} />
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
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

export function ThreadListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="card divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className={`w-12 h-12 rounded-full ${bone} shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-1/3 ${bone} rounded`} />
            <div className={`h-3 w-2/3 ${bone} rounded`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-4 animate-pulse">
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full ${bone} shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className={`h-4 w-1/2 ${bone} rounded`} />
            <div className={`h-3 w-1/3 ${bone} rounded`} />
            <div className={`h-3 w-2/3 ${bone} rounded`} />
          </div>
        </div>
      </div>
      <div className="card p-4 space-y-3">
        <div className={`h-4 w-1/3 ${bone} rounded`} />
        <div className={`h-20 w-full ${bone} rounded-xl`} />
      </div>
      <CardListSkeleton count={2} />
    </div>
  );
}
