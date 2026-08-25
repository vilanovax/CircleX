import Link from "next/link";
import { useMemo } from "react";
import ListingCard from "@/components/ListingCard";
import { toPersianDigits } from "@/lib/persian";
import { useStore } from "@/lib/store";
import { canView } from "@/lib/trust";

export default function ListingSellerMore({
  sellerId,
  listingId,
}: {
  sellerId: string;
  listingId: string;
}) {
  const listings = useStore((s) => s.listings);
  const getPerson = useStore((s) => s.getPerson);
  const hiddenListings = useStore((s) => s.hiddenListings);
  const hiddenPeople = useStore((s) => s.hiddenPeople);

  const others = useMemo(
    () => {
      if (hiddenPeople.includes(sellerId)) return [];
      return listings
        .filter(
          (row) =>
            row.sellerId === sellerId &&
            row.id !== listingId &&
            row.dealStatus !== "inactive" &&
            !hiddenListings.includes(row.id) &&
            canView(row, getPerson),
        )
        .slice(0, 2);
    },
    [getPerson, hiddenListings, hiddenPeople, listingId, listings, sellerId],
  );

  if (others.length === 0) return null;

  return (
    <div className="relative z-[1] mt-3 space-y-2">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <p className="text-[12px] font-bold text-ink-muted dark:text-zinc-400">
          سایر آگهی‌ها
        </p>
        <Link
          href={`/person/${sellerId}`}
          className="text-[12px] font-bold text-brand-600 dark:text-brand-400"
        >
          همه آگهی‌ها ‹
        </Link>
      </div>
      {others.map((row) => (
        <ListingCard
          key={row.id}
          listing={row}
          compactTrust
          hideTrust
          showOpenHint
        />
      ))}
      <p className="sr-only">
        {toPersianDigits(others.length)} آگهی دیگر از همین فروشنده
      </p>
    </div>
  );
}
