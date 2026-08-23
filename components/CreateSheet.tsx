"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { lazyUi } from "@/lib/lazy-ui";
import { CalendarIcon, QuestionIcon, TagIcon } from "./Icons";
import { useToast } from "./Toast";
import { useCatalog } from "@/lib/use-catalog";

const AddListingSheet = lazyUi(() => import("./AddListingSheet"));
const AddRequestSheet = lazyUi(() => import("./AddRequestSheet"));
const AddEventSheet = lazyUi(() => import("./AddEventSheet"));

type Step = "menu" | "listing" | "request" | "event";

const MENU_OPTIONS = [
  {
    id: "listing" as const,
    Icon: TagIcon,
    title: "آگهی جدید",
    subtitle: "چیزی برای فروش یا واگذاری دارم",
    tint: "bg-brand-600 text-white",
    ring: "ring-brand-600/15",
  },
  {
    id: "request" as const,
    Icon: QuestionIcon,
    title: "درخواست جدید",
    subtitle: "دنبال چیزی می‌گردم",
    tint: "bg-levelC text-white",
    ring: "ring-levelC/15",
  },
  {
    id: "event" as const,
    Icon: CalendarIcon,
    title: "رویداد جدید",
    subtitle: "دورهمی، کلاس یا جمع کوچک",
    tint: "bg-levelB text-white",
    ring: "ring-levelB/15",
  },
] as const;

export default function CreateSheet({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("menu");
  const publishingRef = useRef(false);
  const router = useRouter();
  const addListing = useStore((s) => s.addListing);
  const addRequest = useStore((s) => s.addRequest);
  const addEvent = useStore((s) => s.addEvent);
  const { show } = useToast();
  const flags = useCatalog().flags;
  const panelRef = useRef<HTMLDivElement>(null);
  const handleEscape = useCallback(() => {
    if (step !== "menu") {
      setStep("menu");
      return true;
    }
    return false;
  }, [step]);
  useSheetA11y(panelRef, onClose, { onEscape: handleEscape });

  const onAddListing = useCallback(
    async (input: Parameters<typeof addListing>[0]) => {
      if (publishingRef.current) return;
      publishingRef.current = true;
      try {
        const id = await addListing(input);
        onClose();
        show("آگهی شما در حلقه منتشر شد ✓");
        router.push(`/listing/${id}`);
      } catch (err) {
        show(err instanceof ApiError ? err.message : "آگهی ذخیره نشد");
        publishingRef.current = false;
      }
    },
    [addListing, onClose, router, show],
  );

  const onAddRequest = useCallback(
    async (input: Parameters<typeof addRequest>[0]) => {
      try {
        const id = await addRequest(input);
        onClose();
        show("درخواست شما ثبت شد ✓");
        router.push(`/request/${id}`);
      } catch (err) {
        show(err instanceof ApiError ? err.message : "درخواست ذخیره نشد");
      }
    },
    [addRequest, onClose, router, show],
  );

  const onAddEvent = useCallback(
    async (input: Parameters<typeof addEvent>[0]) => {
      try {
        const id = await addEvent(input);
        onClose();
        show("رویداد شما ساخته شد ✓");
        router.push(`/event/${id}`);
      } catch (err) {
        show(err instanceof ApiError ? err.message : "رویداد ذخیره نشد");
      }
    },
    [addEvent, onClose, router, show],
  );

  const goMenu = useCallback(() => setStep("menu"), []);

  if (step === "listing") {
    return (
      <AddListingSheet
        onClose={onClose}
        onBack={goMenu}
        onAdd={onAddListing}
      />
    );
  }

  if (step === "request") {
    return (
      <AddRequestSheet
        onClose={onClose}
        onBack={goMenu}
        onAdd={onAddRequest}
      />
    );
  }

  if (step === "event") {
    return (
      <AddEventSheet onClose={onClose} onBack={goMenu} onAdd={onAddEvent} />
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div
          className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-sheet-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-[color:var(--circle-surface)] dark:bg-zinc-900 rounded-t-[1.35rem] px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-slide-up outline-none shadow-[0_-8px_40px_rgba(26,24,22,0.12)]"
        >
          <div className="w-9 h-1 bg-stone-300/80 dark:bg-zinc-600 rounded-full mx-auto mb-4" />

          <div className="flex items-start justify-between gap-3 mb-4 px-0.5">
            <h2
              id="create-sheet-title"
              className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
            >
              چه چیزی می‌خواهی ثبت کنی؟
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-[13px] font-semibold text-ink-muted dark:text-zinc-400 px-2 py-1 rounded-lg active:bg-stone-100 dark:active:bg-zinc-800"
            >
              بستن
            </button>
          </div>

          <div className="card overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800">
            {MENU_OPTIONS.filter((o) => {
              if (o.id === "request") return flags.requests;
              if (o.id === "event") return flags.events;
              return true;
            }).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setStep(o.id)}
                onPointerEnter={() => {
                  if (o.id === "listing") void import("./AddListingSheet");
                  else if (o.id === "request") void import("./AddRequestSheet");
                  else void import("./AddEventSheet");
                }}
                className="w-full flex items-center gap-3 px-3.5 py-3.5 text-right active:bg-stone-50/90 dark:active:bg-zinc-800/70 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-4 ${o.tint} ${o.ring}`}
                >
                  <o.Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[14px] text-ink dark:text-zinc-100">
                    {o.title}
                  </p>
                  <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
                    {o.subtitle}
                  </p>
                </div>
                <span
                  className="text-ink-faint dark:text-zinc-600 text-base shrink-0"
                  aria-hidden
                >
                  ‹
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
