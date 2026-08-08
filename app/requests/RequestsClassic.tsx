"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import RequestCard from "@/components/RequestCard";
import AddRequestSheet from "@/components/AddRequestSheet";
import EmptyState from "@/components/EmptyState";
import { CardListSkeleton } from "@/components/Skeleton";
import { PlusIcon } from "@/components/Icons";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";

function RequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { requests, getPerson, addRequest, hydrated } = useStore();
  const { show } = useToast();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (searchParams.get("compose") === "1") {
      setShowAdd(true);
    }
  }, [searchParams]);

  function closeAddSheet() {
    setShowAdd(false);
    if (searchParams.get("compose") === "1") {
      router.replace("/requests");
    }
  }

  const visible = useMemo(
    () => requests.filter((r) => canView(r, getPerson)),
    [requests, getPerson],
  );

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="درخواست‌ها"
        subtitle="چیزهایی که حلقه‌ی شما دنبالش می‌گردد"
        back
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700"
            aria-label="ثبت درخواست"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-amber-50 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 p-4">
          <p className="font-bold text-sm text-amber-800 dark:text-amber-300">یک نیاز داری؟ از حلقه بپرس</p>
          <p className="text-xs text-amber-700 dark:text-amber-200/80 mt-1 leading-relaxed">
            به‌جای جستجو بین غریبه‌ها، درخواستت را بین آدم‌های مورد اعتمادت بگذار تا
            خودشان یا آشناهاشان کمکت کنند.
          </p>
        </div>
      </div>

      <section className="px-4 pt-3 space-y-3">
        {!hydrated ? (
          <CardListSkeleton count={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="🔎"
            title="هنوز درخواستی نیست"
            description="نیازت را بین حلقه‌ی اعتمادت بگذار تا دیگران یا آشناهایشان کمکت کنند."
            actionLabel="ثبت اولین درخواست"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          visible.map((r) => <RequestCard key={r.id} request={r} />)
        )}
      </section>

      {showAdd && (
        <AddRequestSheet
          onClose={closeAddSheet}
          onAdd={(input) => {
            addRequest(input);
            closeAddSheet();
            show("درخواست شما ثبت شد ✓");
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

export default function RequestsClassic() {
  return (
    <Suspense>
      <RequestsContent />
    </Suspense>
  );
}
