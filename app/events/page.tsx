"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EventCard from "@/components/EventCard";
import AddEventSheet from "@/components/AddEventSheet";
import EmptyState from "@/components/EmptyState";
import { CardListSkeleton } from "@/components/Skeleton";
import { PlusIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { canView } from "@/lib/trust";

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
        subtitle="با حلقه‌ات وقت بگذران"
        back
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center active:bg-brand-700"
            aria-label="ساخت رویداد"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-gradient-to-l from-brand-700 to-brand-500 text-white p-4">
          <p className="font-extrabold text-sm">سیرکل فقط خریدوفروش نیست</p>
          <p className="text-xs text-brand-50 mt-1 leading-relaxed">
            کلاس، دورهمی خانوادگی، بازارچه‌ی خیریه، بازی کودکان و سفر گروهی — همه
            بین آدم‌هایی که می‌شناسی و بهشان اعتماد داری.
          </p>
        </div>
      </div>

      <section className="px-4 pt-3 space-y-3">
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
          visible.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </section>

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

export default function EventsPage() {
  return (
    <Suspense>
      <EventsContent />
    </Suspense>
  );
}
