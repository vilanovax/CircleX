// Loading placeholders shown while the store hydrates.

import { ShieldCheckIcon } from "./Icons";

const bone = "bg-zinc-100 dark:bg-zinc-800";

export function ListingCardSkeleton() {
  return (
    <div className="card p-2.5 animate-pulse">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-8 h-8 rounded-full ${bone} shrink-0`} />
        <div className={`h-3 w-24 ${bone} rounded`} />
      </div>
      <div className="flex gap-2.5">
        <div className={`w-24 h-24 rounded-xl ${bone} shrink-0`} />
        <div className="flex-1 space-y-2 py-1">
          <div className={`h-4 w-3/4 ${bone} rounded`} />
          <div className={`h-4 w-1/3 ${bone} rounded`} />
          <div className={`h-3 w-1/2 ${bone} rounded`} />
        </div>
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

/** First paint while session resolves — matches home chrome so LCP is the title. */
export function HomeBootSkeleton() {
  return (
    <div
      className="pb-24 min-h-[100dvh]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <header className="sticky top-0 z-20 border-b border-transparent bg-[color:var(--circle-canvas)] dark:bg-zinc-950">
        <div className="px-4 pt-[max(0.85rem,env(safe-area-inset-top))] pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/20">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <p className="text-[15px] font-extrabold text-ink dark:text-zinc-50 tracking-tight">
              سیرکل
            </p>
          </div>
        </div>
      </header>
      <section className="px-4 pt-3.5">
        <div className="h-5 w-16 rounded bg-zinc-100 dark:bg-zinc-800 mb-2.5" />
        <FeedSkeleton />
      </section>
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

export function ListingDetailSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <div className="h-[17.5rem] w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      <div className="px-4 pt-4 space-y-3 animate-pulse">
        <div className="flex gap-1.5">
          <div className={`h-6 w-14 ${bone} rounded-full`} />
          <div className={`h-6 w-12 ${bone} rounded-full`} />
        </div>
        <div className={`h-7 w-3/4 ${bone} rounded`} />
        <div className={`h-6 w-20 ${bone} rounded`} />
        <div className={`h-16 w-full ${bone} rounded-xl`} />
        <div className={`h-24 w-full ${bone} rounded-2xl`} />
      </div>
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
