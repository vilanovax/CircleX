"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EventCard from "@/components/EventCard";
import { lazyUi } from "@/lib/lazy-ui";
import EmptyState from "@/components/EmptyState";
import { CardListSkeleton } from "@/components/Skeleton";
import { PlusIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { canView } from "@/lib/trust";
import { toPersianDigits } from "@/lib/persian";

const AddEventSheet = lazyUi(() => import("@/components/AddEventSheet"));

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { events, getPerson, addEvent, hydrated } = useStore();
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
      router.replace("/events");
    }
  }

  const visible = useMemo(
    () => events.filter((e) => canView(e, getPerson)),
    [events, getPerson],
  );

  return (
    <main className="pb-24 min-h-[100dvh]">
      <Header
        title="رویدادها و دورهمی‌ها"
        subtitle={
          hydrated && visible.length > 0
            ? `${toPersianDigits(visible.length)} رویداد`
            : "با حلقه وقت بگذرانید"
        }
        back
        action={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/20 active:bg-brand-700"
            aria-label="ساخت رویداد"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3 space-y-3">
        <div className="card px-3.5 py-3">
          <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
            سیرکل فقط خریدوفروش نیست
          </p>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
            کلاس، دورهمی خانوادگی، بازارچه‌ی خیریه، بازی کودکان و سفر گروهی — همه
            بین آدم‌هایی که می‌شناسی.
          </p>
        </div>

        {!hydrated ? (
          <CardListSkeleton count={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="🎉"
            title="رویدادی نیست"
            description="کلاس، دورهمی، بازارچه یا سفر گروهی — بین آدم‌هایی که می‌شناسی."
            actionLabel="ساخت اولین رویداد"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <div className="space-y-2.5">
            {visible.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddEventSheet
          onClose={closeAddSheet}
          onAdd={(input) => {
            addEvent(input);
            closeAddSheet();
            show("رویداد شما ساخته شد ✓");
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

export default function EventsClassic() {
  return (
    <Suspense>
      <EventsContent />
    </Suspense>
  );
}
