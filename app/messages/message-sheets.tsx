"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { activeCircle } from "@/lib/circle-member";
import Avatar from "@/components/Avatar";
import SheetShell from "@/components/SheetShell";
import {
  ArchiveIcon,
  ChatIcon,
  PinIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/Icons";
import { viewerRelationPhrase } from "@/lib/trust";

export function ThreadActionsSheet({
  name,
  avatar,
  pinned,
  archived,
  onClose,
  onPin,
  onArchive,
  onDelete,
}: {
  name: string;
  avatar: string;
  pinned: boolean;
  archived: boolean;
  onClose: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <SheetShell
      onClose={onClose}
      labelledBy="thread-actions-title"
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost w-full !py-3.5"
        >
          انصراف
        </button>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={name} src={avatar} size="md" showLevel={false} />
        <div className="min-w-0">
          <h2
            id="thread-actions-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight truncate"
          >
            {name}
          </h2>
          <p className="text-[12px] text-ink-muted mt-0.5">
            این کارها فقط در لیست پیام‌های تو دیده می‌شود
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 dark:border-zinc-800 overflow-hidden">
        <ActionRow
          icon={<PinIcon className="w-[18px] h-[18px]" />}
          iconClass={
            pinned
              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
              : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300"
          }
          title={pinned ? "برداشتن سنجاق" : "سنجاق بالای لیست"}
          hint={
            pinned
              ? "از بالای پیام‌ها پایین می‌آید"
              : "همیشه بالای بقیه گفتگوها می‌ماند"
          }
          onClick={onPin}
        />
        <div className="h-px bg-stone-100 dark:bg-zinc-800" />
        <ActionRow
          icon={<ArchiveIcon className="w-[18px] h-[18px]" />}
          iconClass="bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
          title={archived ? "بازگرداندن به پیام‌ها" : "آرشیو کردن"}
          hint={
            archived
              ? "دوباره در تب «همه» دیده می‌شود"
              : "از لیست اصلی می‌رود؛ از تب آرشیو برمی‌گردد"
          }
          onClick={onArchive}
        />
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="mt-3 w-full rounded-2xl border border-red-200/80 dark:border-red-500/25 bg-red-50/70 dark:bg-red-500/10 px-3.5 py-3 flex items-center gap-3 text-right active:scale-[0.99] transition-transform"
      >
        <span className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
          <TrashIcon className="w-[18px] h-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-red-700 dark:text-red-300">
            حذف برای من
          </span>
          <span className="block text-[11.5px] text-red-700/70 dark:text-red-300/70 mt-0.5 leading-snug">
            از دستگاه تو پاک می‌شود — برای {name} باقی می‌ماند
          </span>
        </span>
      </button>
    </SheetShell>
  );
}

function ActionRow({
  icon,
  iconClass,
  title,
  hint,
  onClick,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50 dark:active:bg-zinc-800/80 transition-colors"
    >
      <span
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold text-ink dark:text-zinc-100">
          {title}
        </span>
        <span className="block text-[11.5px] text-ink-muted mt-0.5 leading-snug">
          {hint}
        </span>
      </span>
    </button>
  );
}

export function ComposeSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const people = useStore((s) => s.people);
  const circle = useMemo(() => activeCircle(people), [people]);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim();
    if (!needle) return circle;
    return circle.filter((p) => p.name.includes(needle));
  }, [circle, q]);

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="compose-title"
      zClass="z-50"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost w-full !py-3"
        >
          انصراف
        </button>
      }
    >
      <div className="flex items-start justify-between gap-3 mb-3 px-0.5">
        <div>
          <h2
            id="compose-title"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50"
          >
            گفتگوی جدید
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1">
            فقط حلقه‌ات اینجاست
          </p>
        </div>
      </div>

      {circle.length > 0 ? (
        <label className="relative block mb-3">
          <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی نام…"
            className="input !pr-9 !py-2.5 !text-[13px]"
            autoComplete="off"
            autoFocus
          />
        </label>
      ) : null}

      <div className="card overflow-hidden divide-y divide-stone-100 dark:divide-zinc-800 mb-2">
        {circle.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-ink-muted">هنوز کسی در حلقه‌ات نیست.</p>
            <Link
              href="/circle"
              className="btn-primary inline-block mt-4 text-sm"
            >
              ساخت حلقه
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 px-4 text-sm text-ink-muted">
            کسی با این نام نیست.
          </p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onClose();
                router.push(`/messages/${p.id}`);
              }}
              className="cv-row w-full flex items-center gap-3 px-3.5 py-3 text-right active:bg-stone-50/90 dark:active:bg-zinc-800/70 transition-colors"
            >
              <Avatar
                name={p.name}
                src={p.avatar}
                size="sm"
                showLevel={false}
              />
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[13px] font-bold text-ink dark:text-zinc-100">
                  {p.name}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {viewerRelationPhrase(p)}
                </p>
              </div>
              <span className="text-brand-600" aria-hidden>
                <ChatIcon className="w-4 h-4" />
              </span>
            </button>
          ))
        )}
      </div>
    </SheetShell>
  );
}
