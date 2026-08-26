"use client";

import { useEffect, useState, type ReactNode } from "react";
import SheetShell from "@/components/SheetShell";

export function ListingEditRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.setTimeout(onClick, 0);
      }}
      className="flex w-full min-h-12 items-center gap-3 px-3 py-3 text-right active:bg-stone-50 dark:active:bg-zinc-800/80"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-ink dark:text-zinc-100">
          {label}
        </span>
        {value ? (
          <span className="mt-0.5 block line-clamp-2 text-[12px] leading-snug text-ink-muted dark:text-zinc-400">
            {value}
          </span>
        ) : null}
      </span>
      <span aria-hidden className="shrink-0 text-[15px] text-ink-faint">
        ‹
      </span>
    </button>
  );
}

export function ListingEditRows({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-stone-200/80 dark:border-zinc-700 divide-y divide-stone-100 dark:divide-zinc-800">
      {children}
    </div>
  );
}

export function ListingEditSectionSheet({
  title,
  labelledBy,
  onClose,
  children,
}: {
  title: string;
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 280);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <SheetShell
      onClose={onClose}
      labelledBy={labelledBy}
      zClass="z-[70]"
      maxHeight="88dvh"
      closeOnBackdrop={ready}
      header={
        <div className="flex items-center justify-between gap-2">
          <h2
            id={labelledBy}
            className="min-w-0 text-[20px] font-extrabold tracking-tight text-ink dark:text-zinc-50"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 min-h-11 px-2 text-[13.5px] font-semibold text-brand-600 dark:text-brand-400"
          >
            تمام
          </button>
        </div>
      }
    >
      {children}
    </SheetShell>
  );
}
