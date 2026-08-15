"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import RequestCard from "@/components/RequestCard";
import { lazyUi } from "@/lib/lazy-ui";
import EmptyState from "@/components/EmptyState";
import { CardListSkeleton } from "@/components/Skeleton";
import { PlusIcon } from "@/components/Icons";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import { toPersianDigits } from "@/lib/persian";

const AddRequestSheet = lazyUi(() => import("@/components/AddRequestSheet"));

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
        subtitle={
          hydrated && visible.length > 0
            ? `${toPersianDigits(visible.length)} درخواست در حلقه`
            : "چیزهایی که حلقه‌ات دنبالش می‌گردد"
        }
        back
        action={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/20 active:bg-brand-700"
            aria-label="ثبت درخواست"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3 space-y-3">
        <div className="card px-3.5 py-3">
          <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
            یک نیاز داری؟ از حلقه بپرس
          </p>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
            به‌جای جستجو بین غریبه‌ها، درخواست را بین حلقه‌ات بگذار تا
            خودشان یا آشنایانشان کمک کنند.
          </p>
        </div>

        {!hydrated ? (
          <CardListSkeleton count={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="🔎"
            title="هنوز درخواستی نیست"
            description="درخواست را بین حلقه‌ات بگذار تا دیگران یا آشنایانشان کمک کنند."
            actionLabel="ثبت اولین درخواست"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <div className="space-y-2.5">
            {visible.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>

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
