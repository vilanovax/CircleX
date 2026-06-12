"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CardListSkeleton } from "@/components/Skeleton";

/** Legacy route — نشان‌شده‌ها فقط در پروفایل نمایش داده می‌شود. */
export default function SavedRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile#saved");
  }, [router]);

  return (
    <main className="pb-24 min-h-[100dvh]">
      <section className="px-4 pt-3">
        <CardListSkeleton count={2} />
      </section>
    </main>
  );
}
