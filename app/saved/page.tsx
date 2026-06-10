"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import ListingCard from "@/components/ListingCard";
import { HeartIcon } from "@/components/Icons";

export default function SavedPage() {
  const { saved, listings } = useStore();
  // Preserve save order (saved is newest-first).
  const items = saved
    .map((id) => listings.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header title="نشان‌شده‌ها" subtitle="آگهی‌هایی که ذخیره کرده‌اید" back />

      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center px-8 py-20">
          <div className="w-16 h-16 rounded-full bg-pink-50 dark:bg-pink-500/15 flex items-center justify-center text-pink-400 mb-4">
            <HeartIcon className="w-8 h-8" />
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            هنوز چیزی نشان نکرده‌اید. روی آیکون ❤ در هر آگهی بزنید تا اینجا ذخیره
            شود.
          </p>
          <Link href="/" className="btn-primary inline-block mt-5">
            دیدن آگهی‌ها
          </Link>
        </div>
      ) : (
        <section className="px-4 pt-3 space-y-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </section>
      )}

      <BottomNav />
    </main>
  );
}
