"use client";

import type { ReactNode } from "react";
import SheetShell from "@/components/SheetShell";
import ListingImage from "@/components/ListingImage";
import {
  ChartBarsIcon,
  ChatIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  TagIcon,
  TrashIcon,
} from "@/components/Icons";
import {
  formatPrice,
  listingDisplayTitle,
  listingTypeLabels,
} from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import type { Listing } from "@/lib/types";

export default function OwnerListingMenuSheet({
  listing,
  conversationCount = 0,
  onClose,
  onEdit,
  onStats,
  onMessages,
  onDeactivate,
  onReactivate,
  onDelete,
}: {
  listing: Listing;
  conversationCount?: number;
  onClose: () => void;
  onEdit: () => void;
  onStats: () => void;
  onMessages: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
  const inactive = listing.dealStatus === "inactive";
  const title = listingDisplayTitle(listing.title, listing.type);
  const priceLabel =
    listing.price != null
      ? formatPrice(listing.price)
      : listing.type === "service"
        ? "توافقی"
        : "رایگان";
  const statusLabel = inactive ? "غیرفعال" : "در حلقه دیده می‌شود";
  const messageHint =
    conversationCount > 0
      ? `${toPersianDigits(conversationCount)} گفتگو`
      : "هنوز پیامی نیست";

  return (
    <SheetShell
      onClose={onClose}
      labelledBy="owner-listing-menu"
      zClass="z-50"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0 ring-1 ring-brand-200/70 dark:ring-brand-500/25">
          <TagIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h2
            id="owner-listing-menu"
            className="font-extrabold text-[1.15rem] text-ink dark:text-zinc-50 leading-tight"
          >
            آگهی تو
          </h2>
          <p className="text-[12px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
            ویرایش، آمار، یا برداشتن از فید.
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-stone-100/80 dark:bg-zinc-800/70 px-2.5 py-2 ring-1 ring-stone-200/70 dark:ring-zinc-700/80">
        <ListingImage
          image={listing.image}
          alt={title}
          size="sm"
          category={listing.category}
          type={listing.type}
          frameClassName="w-12 h-12 rounded-xl overflow-hidden shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-ink dark:text-zinc-100 leading-snug line-clamp-2">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted dark:text-zinc-400 nums truncate">
            {listingTypeLabels[listing.type]} · {priceLabel}
            <span className={inactive ? " text-ink-faint" : ""}>
              {" "}
              · {statusLabel}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ActionRow
          icon={
            <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
              <PencilIcon className="w-[1.15rem] h-[1.15rem]" />
            </span>
          }
          label="ویرایش آگهی"
          hint="عنوان، عکس و جزئیات"
          onClick={onEdit}
        />
        <ActionRow
          icon={
            <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
              <ChartBarsIcon className="w-[1.15rem] h-[1.15rem]" />
            </span>
          }
          label="آمار آگهی"
          hint="گفتگو و نمایش حرف آشنایان"
          onClick={onStats}
        />
        <ActionRow
          icon={
            <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
              <ChatIcon className="w-[1.15rem] h-[1.15rem]" />
            </span>
          }
          label="پیام‌های این آگهی"
          hint={messageHint}
          onClick={onMessages}
        />
        {inactive ? (
          <ActionRow
            icon={
              <span className="w-10 h-10 rounded-xl bg-[color:var(--circle-trust)]/10 dark:bg-[color:var(--circle-trust)]/15 text-[color:var(--circle-trust)] flex items-center justify-center shrink-0">
                <EyeIcon className="w-[1.15rem] h-[1.15rem]" />
              </span>
            }
            label="دوباره فعال کن"
            hint="دوباره در فید حلقه دیده می‌شود"
            tone="trust"
            onClick={onReactivate}
          />
        ) : (
          <ActionRow
            icon={
              <span className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <EyeOffIcon className="w-[1.15rem] h-[1.15rem]" />
              </span>
            }
            label="این آگهی دیگر دیده نشود"
            hint="از فید حلقه برداشته می‌شود؛ هر وقت بخواهی برمی‌گردد"
            tone="danger"
            onClick={onDeactivate}
          />
        )}
      </div>

      <div className="h-px bg-stone-200/80 dark:bg-zinc-700/80 mx-1 my-3" />

      <ActionRow
        icon={
          <span className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <TrashIcon className="w-[1.15rem] h-[1.15rem]" />
          </span>
        }
        label="حذف آگهی"
        hint="برای همیشه پاک می‌شود"
        tone="danger"
        onClick={onDelete}
      />
    </SheetShell>
  );
}

function ActionRow({
  icon,
  label,
  hint,
  onClick,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  tone?: "default" | "danger" | "trust";
}) {
  const labelColor =
    tone === "danger"
      ? "text-red-700 dark:text-red-400"
      : tone === "trust"
        ? "text-[color:var(--circle-trust)]"
        : "text-ink dark:text-zinc-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 text-right rounded-2xl bg-stone-50 dark:bg-zinc-800/55 px-3 py-3 min-h-[3.5rem] ring-1 ring-stone-200 dark:ring-zinc-700 transition-[transform,background-color] duration-150 ease-out active:scale-[0.985] active:bg-stone-100 dark:active:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      {icon}
      <span className="min-w-0 flex-1">
        <span className={`block text-[14px] font-bold leading-snug ${labelColor}`}>
          {label}
        </span>
        <span className="block text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-snug">
          {hint}
        </span>
      </span>
      <span
        className="shrink-0 text-[15px] font-bold text-ink-faint leading-none"
        aria-hidden
      >
        ‹
      </span>
    </button>
  );
}
