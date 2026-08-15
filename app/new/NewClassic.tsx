"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import ListingComposeForm from "@/components/ListingComposeForm";
import { useToast } from "@/components/Toast";

/** Full-page route for deep links; primary flow is + → CreateSheet. */
export default function NewClassic() {
  const router = useRouter();
  const { addListing } = useStore();
  const { show } = useToast();
  const [publishing, setPublishing] = useState(false);

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header title="آگهی جدید" back />

      <div className="px-4 pt-4 space-y-5">
        <Link
          href="/requests?compose=1"
          className="card block px-3.5 py-3 active:scale-[0.99] transition"
        >
          <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
            دنبال چیزی هستید؟
          </p>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
            مثلاً «کلاس نقاشی کودک» — به‌جای آگهی،{" "}
            <span className="font-semibold text-amber-800/80 dark:text-amber-200/90">درخواست</span>{" "}
            ثبت کنید تا افراد حلقه بتوانند کمک کنند.
          </p>
        </Link>

        <ListingComposeForm
          submitLabel={publishing ? "در حال انتشار…" : "انتشار آگهی در حلقه"}
          onSubmit={async (input) => {
            if (publishing) return;
            setPublishing(true);
            try {
              const id = await addListing(input);
              show("آگهی شما در حلقه منتشر شد ✓");
              router.push(`/listing/${id}`);
            } catch (err) {
              show(err instanceof ApiError ? err.message : "آگهی ذخیره نشد");
              setPublishing(false);
            }
          }}
        />
      </div>
    </main>
  );
}
