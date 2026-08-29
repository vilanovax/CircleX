"use client";

import { useState } from "react";
import AddToCircleSheet from "@/components/AddToCircleSheet";
import { ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { Person } from "@/lib/types";
import { useToast } from "@/components/Toast";

export default function AddedYouBanner({ compact }: { compact?: boolean }) {
  const addedYou = useStore((s) => s.addedYou);
  const addToCircle = useStore((s) => s.addToCircle);
  const { show } = useToast();
  const [placing, setPlacing] = useState<Person | null>(null);
  const first = addedYou[0];
  if (!first) return null;

  const more = addedYou.length - 1;
  const title =
    more > 0
      ? `${first.name} و ${more} نفر دیگر تو را به حلقه‌شان اضافه کردند`
      : `${first.name} تو را به حلقه‌اش اضافه کرد`;

  return (
    <>
      <div className="card px-3.5 py-3">
        <p
          className={
            compact
              ? "text-[13px] font-bold text-ink dark:text-zinc-100"
              : "text-[15px] font-extrabold text-ink dark:text-zinc-50 leading-snug"
          }
        >
          {title}
        </p>
        <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">
          حلقه دوطرفه است. اگر می‌شناسی‌اش، جایش را در حلقهٔ خودت مشخص کن.
        </p>
        <button
          type="button"
          onClick={() => setPlacing(first)}
          className={
            compact
              ? "mt-2.5 block text-[13px] font-semibold text-brand-700 dark:text-brand-400"
              : "btn-primary mt-2.5 min-h-11 inline-flex items-center justify-center text-[13px] font-bold"
          }
        >
          {`جا بگذار ${first.name} را`}
        </button>
      </div>
      {placing ? (
        <AddToCircleSheet
          person={{
            ...placing,
            relation: "friend",
            level: "B",
          }}
          onClose={() => setPlacing(null)}
          onAdd={(input) => {
            void addToCircle(placing.id, input)
              .then(() => {
                setPlacing(null);
                show(`${placing.name} به حلقه‌ات اضافه شد ✓`);
              })
              .catch((err) =>
                show(
                  err instanceof ApiError
                    ? err.message
                    : "اضافه نشد. دوباره بزن.",
                ),
              );
          }}
        />
      ) : null}
    </>
  );
}
