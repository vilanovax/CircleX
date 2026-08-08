"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import ListingComposeForm from "@/components/ListingComposeForm";
import { useToast } from "@/components/Toast";

/** Full-page route for deep links; primary flow is + → CreateSheet. */
export default function NewClassic() {
  const router = useRouter();
  const { addListing } = useStore();
  const { show } = useToast();

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="ثبت آگهی جدید" back />

      <div className="px-4 pt-4 space-y-5">
        <Link
          href="/requests?compose=1"
          className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-3 py-2.5 active:scale-[0.99] transition"
        >
          <span className="text-base">🔎</span>
          <span className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed flex-1">
            دنبال چیزی می‌گردی (مثل «کلاس نقاشی کودک»)؟ به‌جای آگهی، اینجا{" "}
            <span className="font-bold">درخواست</span> ثبت کن.
          </span>
          <span className="text-amber-400 text-lg">‹</span>
        </Link>

        <ListingComposeForm
          submitLabel="انتشار آگهی در حلقه"
          onSubmit={(input) => {
            const id = addListing(input);
            show("آگهی شما در حلقه منتشر شد ✓");
            router.push(`/listing/${id}`);
          }}
        />
      </div>
    </main>
  );
}
