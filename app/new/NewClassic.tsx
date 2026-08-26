"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import ListingComposeForm, {
  type ListingComposeHandle,
} from "@/components/ListingComposeForm";
import ListingComposeProgress from "@/components/ListingComposeProgress";
import { useToast } from "@/components/Toast";
import { useCatalog } from "@/lib/use-catalog";

/** Full-page route for deep links; primary flow is + → CreateSheet. */
export default function NewClassic() {
  const router = useRouter();
  const addListing = useStore((s) => s.addListing);
  const { show } = useToast();
  const [publishing, setPublishing] = useState(false);
  const catalog = useCatalog();
  const formRef = useRef<ListingComposeHandle>(null);
  const [step, setStep] = useState<"compose" | "review">("compose");
  const reviewing = step === "review";

  const onFooterMetaChange = useCallback(
    (meta: {
      canSubmit: boolean;
      primaryLabel: string;
      hint?: string;
      step: "compose" | "review";
    }) => {
      setStep(meta.step);
    },
    [],
  );

  return (
    <main className="pb-28 min-h-[100dvh]">
      <Header
        title="آگهی جدید"
        back
        onBack={
          reviewing ? () => formRef.current?.goBack?.() : undefined
        }
      />

      <div className="px-4 pt-4 space-y-5">
        <ListingComposeProgress step={step} className="" />
        {catalog.flags.requests && !reviewing ? (
          <Link
            href="/requests?compose=1"
            className="card block px-3.5 py-3 active:scale-[0.99] transition"
          >
            <p className="font-bold text-[13px] text-ink dark:text-zinc-100">
              دنبال چیزی هستی؟
            </p>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
              مثلاً «کلاس نقاشی کودک» — به‌جای آگهی،{" "}
              <span className="font-semibold text-amber-800/80 dark:text-amber-200/90">درخواست</span>{" "}
              ثبت کن تا افراد حلقه بتوانند کمک کنند.
            </p>
          </Link>
        ) : null}

        <ListingComposeForm
          ref={formRef}
          submitLabel={publishing ? "در حال انتشار…" : "انتشار آگهی در حلقه"}
          onFooterMetaChange={onFooterMetaChange}
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
