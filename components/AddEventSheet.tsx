"use client";

import { memo, useCallback, useRef, useState } from "react";
import JalaliDateField from "@/components/JalaliDateField";
import PrivacyPicker from "@/components/PrivacyPicker";
import SheetShell from "@/components/SheetShell";
import { BackIcon, ClockIcon, CloseIcon, MapPinIcon } from "@/components/Icons";
import { eventKindEmoji, eventKindLabels } from "@/lib/labels";
import {
  formatEventDateDisplay,
  toEnglishDigits,
  toPersianDigits,
} from "@/lib/persian";
import { useToast } from "@/components/Toast";
import type { EventKind, Privacy } from "@/lib/types";

const KINDS: EventKind[] = [
  "social",
  "family",
  "class",
  "kids",
  "trip",
  "charity",
];

export type EventInput = {
  title: string;
  description: string;
  kind: EventKind;
  image: string;
  date: string;
  time?: string;
  location: string;
  capacity?: number;
  privacy: Privacy;
};

function formatCountInput(raw: string): string {
  const digits = toEnglishDigits(raw).replace(/\D/g, "").slice(0, 3);
  if (!digits) return "";
  return toPersianDigits(digits);
}

type Draft = {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: string;
};

export default function AddEventSheet({
  onClose,
  onAdd,
  onBack,
}: {
  onClose: () => void;
  onAdd: (input: EventInput) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { show } = useToast();
  const draftRef = useRef<Draft>({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
  });
  const [kind, setKind] = useState<EventKind>("social");
  const [ready, setReady] = useState({ title: false, date: false, location: false });
  const [privacy, setPrivacy] = useState<Privacy>("ABC");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = ready.title && ready.date && ready.location;

  const onTitleChange = useCallback((title: string) => {
    draftRef.current.title = title;
    const ok = Boolean(title.trim());
    setReady((prev) => (prev.title === ok ? prev : { ...prev, title: ok }));
  }, []);

  const onDateChange = useCallback((date: string) => {
    draftRef.current.date = date;
    const ok = Boolean(date.trim());
    setReady((prev) => (prev.date === ok ? prev : { ...prev, date: ok }));
  }, []);

  const onLocationChange = useCallback((location: string) => {
    draftRef.current.location = location;
    const ok = Boolean(location.trim());
    setReady((prev) =>
      prev.location === ok ? prev : { ...prev, location: ok },
    );
  }, []);

  const onTimeChange = useCallback((time: string) => {
    draftRef.current.time = time;
  }, []);

  const onDescriptionChange = useCallback((description: string) => {
    draftRef.current.description = description;
  }, []);

  const onCapacityChange = useCallback((capacity: string) => {
    draftRef.current.capacity = capacity;
  }, []);

  async function submit() {
    if (!canSubmit || submitting) return;
    const { title, description, date, time, location, capacity } =
      draftRef.current;
    setSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim(),
        kind,
        image: eventKindEmoji[kind],
        date: formatEventDateDisplay(date.trim()),
        time: time.trim() || undefined,
        location: location.trim(),
        capacity: capacity
          ? Number(toEnglishDigits(capacity).replace(/\D/g, "")) || undefined
          : undefined,
        privacy,
      });
    } catch (err) {
      show(err instanceof Error ? err.message : "رویداد ذخیره نشد");
      setSubmitting(false);
    }
  }

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="add-event-title"
      zClass="z-50"
      footer={
        <div>
          {!canSubmit ? (
            <p className="text-[11px] text-ink-muted text-center mb-2 leading-relaxed">
              عنوان، تاریخ و مکان را کامل کن
            </p>
          ) : null}
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void submit()}
            className="btn-primary w-full !py-3 text-[15px] shadow-lg shadow-brand-600/20 active:scale-[0.99] transition-transform duration-150 disabled:opacity-60"
          >
            {submitting ? "در حال ثبت…" : "انتشار رویداد"}
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="بازگشت"
            className="shrink-0 w-9 h-9 -ms-1 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 active:bg-brand-50 dark:active:bg-brand-500/10"
          >
            <BackIcon className="w-5 h-5" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2
            id="add-event-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
          >
            رویداد جدید
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
            زمان و مکان را بگو. فقط حلقه‌ات می‌بیند.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="shrink-0 w-9 h-9 -me-1 rounded-full flex items-center justify-center text-ink-muted dark:text-zinc-400 active:bg-stone-100 dark:active:bg-zinc-800"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <EventKindPicker kind={kind} onChange={setKind} />
      <EventTitleBlock onChange={onTitleChange} />
      <EventDateBlock onChange={onDateChange} />
      <EventTimeBlock onChange={onTimeChange} />
      <EventLocationBlock onChange={onLocationChange} />
      <EventDescBlock onChange={onDescriptionChange} />
      <EventCapacityBlock onChange={onCapacityChange} />

      <div className="mb-2">
        <PrivacyPicker
          value={privacy}
          onChange={setPrivacy}
          showCircleLink
          compact
        />
      </div>
    </SheetShell>
  );
}

const EventKindPicker = memo(function EventKindPicker({
  kind,
  onChange,
}: {
  kind: EventKind;
  onChange: (kind: EventKind) => void;
}) {
  return (
    <section className="mt-3.5 mb-4">
      <p className="block text-[13px] font-bold mb-1.5 text-ink dark:text-zinc-200">
        نوع رویداد
      </p>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="نوع رویداد"
      >
        {KINDS.map((k) => {
          const active = kind === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k)}
              aria-pressed={active}
              className={`rounded-xl px-3 py-2 text-[12px] font-bold border flex items-center gap-1.5 transition-[transform,colors] duration-150 active:scale-[0.97] ${
                active
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-[color:var(--circle-surface)] dark:bg-zinc-900 text-ink-muted border-stone-200/80 dark:border-zinc-700"
              }`}
            >
              <span className="text-sm leading-none" aria-hidden>
                {eventKindEmoji[k]}
              </span>
              {eventKindLabels[k]}
            </button>
          );
        })}
      </div>
    </section>
  );
});

const EventTitleBlock = memo(function EventTitleBlock({
  onChange,
}: {
  onChange: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <section className="mb-3">
      <label
        htmlFor="event-title"
        className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
      >
        عنوان
      </label>
      <input
        id="event-title"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="مثلاً: دورهمی آخر هفته"
        className="field"
        maxLength={80}
      />
    </section>
  );
});

const EventDateBlock = memo(function EventDateBlock({
  onChange,
}: {
  onChange: (iso: string) => void;
}) {
  const [date, setDate] = useState("");
  return (
    <section className="mb-3">
      <label className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200">
        تاریخ
      </label>
      <JalaliDateField
        value={date}
        onChange={(iso) => {
          setDate(iso);
          onChange(iso);
        }}
      />
    </section>
  );
});

const EventTimeBlock = memo(function EventTimeBlock({
  onChange,
}: {
  onChange: (time: string) => void;
}) {
  const [time, setTime] = useState("");
  return (
    <section className="mb-3">
      <label
        htmlFor="event-time"
        className="block text-[12px] font-medium mb-1 text-ink-muted"
      >
        ساعت — اختیاری
      </label>
      <div className="relative">
        <ClockIcon className="w-4 h-4 text-ink-muted absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
        <input
          id="event-time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="مثلاً ۱۸:۰۰"
          className="field !py-2 !text-[13px] !ps-10"
          inputMode="numeric"
        />
      </div>
    </section>
  );
});

const EventLocationBlock = memo(function EventLocationBlock({
  onChange,
}: {
  onChange: (location: string) => void;
}) {
  const [location, setLocation] = useState("");
  return (
    <section className="mb-3">
      <label
        htmlFor="event-location"
        className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
      >
        مکان
      </label>
      <div className="relative">
        <MapPinIcon className="w-4 h-4 text-brand-600 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
        <input
          id="event-location"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="مثلاً: پارک ملت"
          className="field !ps-10"
        />
      </div>
    </section>
  );
});

const EventDescBlock = memo(function EventDescBlock({
  onChange,
}: {
  onChange: (description: string) => void;
}) {
  const [description, setDescription] = useState("");
  return (
    <section className="mb-3">
      <label
        htmlFor="event-desc"
        className="block text-[13px] font-bold mb-1 text-ink dark:text-zinc-200"
      >
        توضیحات{" "}
        <span className="font-medium text-ink-faint">(اختیاری)</span>
      </label>
      <textarea
        id="event-desc"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="جزئیات برنامه، چه چیزی بیاورند…"
        rows={2}
        className="field resize-none min-h-[4.25rem] leading-relaxed"
      />
    </section>
  );
});

const EventCapacityBlock = memo(function EventCapacityBlock({
  onChange,
}: {
  onChange: (capacity: string) => void;
}) {
  const [capacity, setCapacity] = useState("");
  return (
    <section className="mb-4">
      <label
        htmlFor="event-capacity"
        className="block text-[12px] font-medium mb-1 text-ink-muted"
      >
        ظرفیت — اختیاری
      </label>
      <div className="relative">
        <input
          id="event-capacity"
          value={capacity}
          onChange={(e) => {
            const next = formatCountInput(e.target.value);
            setCapacity(next);
            onChange(next);
          }}
          inputMode="numeric"
          placeholder="مثلاً ۱۲"
          className="field nums !py-2 !text-[13px] !pl-12"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-ink-muted pointer-events-none">
          نفر
        </span>
      </div>
    </section>
  );
});
