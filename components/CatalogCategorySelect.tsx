"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon } from "@/components/Icons";

type MenuBox = { top: number; left: number; width: number; maxHeight: number };

function placeMenu(trigger: HTMLElement): MenuBox {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.max(rect.width, 8);
  const left = Math.min(Math.max(8, rect.left), Math.max(8, vw - width - 8));
  const below = vh - rect.bottom - gap - 8;
  const above = rect.top - gap - 8;
  const openDown = below >= 120 || below >= above;
  const maxHeight = Math.max(96, Math.min(280, openDown ? below : above));
  const top = openDown ? rect.bottom + gap : rect.top - gap - maxHeight;
  return { top, left, width, maxHeight };
}

export default function CatalogCategorySelect({
  id,
  value,
  categories,
  onChange,
}: {
  id?: string;
  value: string;
  categories: string[];
  onChange: (next: string) => void;
}) {
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<MenuBox | null>(null);
  const [mounted, setMounted] = useState(false);

  const options = categories.slice();
  if (value && !options.includes(value)) options.unshift(value);

  const sync = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setBox(placeMenu(el));
  }, []);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    sync();
  }, [open, sync]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => sync();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [open, sync]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (categories.length === 0) {
    return (
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field !text-[13px]"
      />
    );
  }

  const menu =
    mounted && open && box
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-labelledby={id}
            style={{
              position: "fixed",
              top: box.top,
              left: box.left,
              width: box.width,
              maxHeight: box.maxHeight,
              zIndex: 80,
            }}
            className="overflow-y-auto overscroll-contain rounded-xl border border-stone-200/90 bg-[color:var(--circle-surface)] py-1 shadow-[0_10px_32px_rgba(26,24,22,0.16)] dark:border-zinc-700 dark:bg-zinc-900"
          >
            {options.map((item) => {
              const active = item === value;
              return (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(item);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full items-center px-3 py-2.5 text-right text-[13px] leading-snug transition-colors ${
                    active
                      ? "bg-brand-50 font-bold text-brand-800 dark:bg-brand-500/15 dark:text-brand-200"
                      : "font-medium text-ink hover:bg-stone-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="field !flex !min-h-12 !items-center !justify-between !gap-2 !py-2.5 !text-[13px] !pe-3"
      >
        <span className="min-w-0 flex-1 truncate text-right">
          {value || "انتخاب دسته"}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-150 dark:text-zinc-400 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {menu}
    </>
  );
}
