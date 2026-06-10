"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EventCard from "@/components/EventCard";
import { PlusIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import { canView } from "@/lib/trust";
import { toEnglishDigits } from "@/lib/persian";
import {
  eventKindEmoji,
  eventKindLabels,
  privacyEmoji,
  privacyLabels,
} from "@/lib/labels";
import type { EventKind, Privacy } from "@/lib/types";

const KINDS: EventKind[] = ["class", "family", "charity", "kids", "trip", "social"];
const PRIVACIES: Privacy[] = ["A", "AB", "ABC", "referral", "approved"];

export default function EventsPage() {
  const { events, getPerson, addEvent } = useStore();
  const { show } = useToast();
  const [showAdd, setShowAdd] = useState(false);

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
        {visible.length === 0 ? (
          <div className="text-center text-zinc-400 py-16 text-sm">
            رویدادی نیست. اولین دورهمی را بساز!
          </div>
        ) : (
          visible.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </section>

      {showAdd && (
        <AddEventSheet
          onClose={() => setShowAdd(false)}
          onAdd={(input) => {
            addEvent(input);
            setShowAdd(false);
            show("رویداد شما ساخته شد ✓");
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function AddEventSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: {
    title: string;
    description: string;
    kind: EventKind;
    image: string;
    date: string;
    time?: string;
    location: string;
    capacity?: number;
    privacy: Privacy;
  }) => void;
}) {
  const [kind, setKind] = useState<EventKind>("social");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("ABC");

  const canSubmit = title.trim() && date.trim() && location.trim();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="app-shell !min-h-0 !shadow-none relative">
        <div className="bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up max-h-[88dvh] overflow-y-auto">
          <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-4" />
          <h2 className="font-bold text-lg mb-4">ساخت رویداد جدید</h2>

          <label className="block text-sm font-medium mb-2">نوع رویداد</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-xl py-2.5 text-[11px] font-medium border flex flex-col items-center gap-1 ${
                  kind === k
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 border-zinc-200"
                }`}
              >
                <span className="text-lg">{eventKindEmoji[k]}</span>
                {eventKindLabels[k]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">عنوان</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً: دورهمی آخر هفته"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="جزئیات برنامه، چه چیزی بیاورند، و…"
            rows={2}
            className="field resize-none mb-4"
          />

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">تاریخ</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="جمعه ۲۲ خرداد"
                className="field"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1">ساعت</label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="۱۸:۰۰"
                className="field"
              />
            </div>
          </div>

          <label className="block text-sm font-medium mb-1">مکان</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثلاً: پارک ملت"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1">ظرفیت (اختیاری)</label>
          <input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            inputMode="numeric"
            placeholder="مثلاً ۱۲"
            className="field nums mb-4"
          />

          <label className="block text-sm font-medium mb-2">چه کسانی ببینند؟</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {PRIVACIES.map((p) => (
              <button
                key={p}
                onClick={() => setPrivacy(p)}
                className={`chip !px-3 !py-1.5 border ${
                  privacy === p
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 border-zinc-200"
                }`}
              >
                {privacyEmoji[p]} {privacyLabels[p]}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              disabled={!canSubmit}
              onClick={() =>
                onAdd({
                  title: title.trim(),
                  description: description.trim(),
                  kind,
                  image: eventKindEmoji[kind],
                  date: date.trim(),
                  time: time.trim() || undefined,
                  location: location.trim(),
                  capacity: capacity
                    ? Number(toEnglishDigits(capacity).replace(/\D/g, "")) || undefined
                    : undefined,
                  privacy,
                })
              }
              className="btn-primary flex-1"
            >
              انتشار رویداد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
