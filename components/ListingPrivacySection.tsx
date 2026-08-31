"use client";

import { useEffect, useMemo, useState } from "react";
import PrivacyPicker from "@/components/PrivacyPicker";
import ListingAudienceSheet from "@/components/ListingAudienceSheet";
import SheetShell from "@/components/SheetShell";
import { activeCircle } from "@/lib/circle-member";
import {
  audienceIsWider,
  listingAudienceLine,
  listingPrivacySummary,
} from "@/lib/listing-privacy";
import { relationLabels } from "@/lib/labels";
import { useStore } from "@/lib/store";
import type { Privacy, RelationType } from "@/lib/types";

const RELATION_OPTIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

export default function ListingPrivacySection({
  privacy,
  onPrivacy,
  hideIdentity,
  onHideIdentity,
  excludePersonIds,
  onExcludePersonIds,
  excludeRelationTypes,
  onExcludeRelationTypes,
  canHideIdentity = true,
  initialPrivacy,
  initialExcludePersonIds,
  initialExcludeRelationTypes,
}: {
  privacy: Privacy;
  onPrivacy: (value: Privacy) => void;
  hideIdentity: boolean;
  onHideIdentity: (value: boolean) => void;
  excludePersonIds: string[];
  onExcludePersonIds: (ids: string[]) => void;
  excludeRelationTypes: RelationType[];
  onExcludeRelationTypes: (types: RelationType[]) => void;
  canHideIdentity?: boolean;
  initialPrivacy?: Privacy;
  initialExcludePersonIds?: string[];
  initialExcludeRelationTypes?: RelationType[];
}) {
  const people = useStore((s) => s.people);
  const circle = useMemo(() => activeCircle(people), [people]);
  const [query, setQuery] = useState("");
  const [showPeople, setShowPeople] = useState(false);
  const [showAudience, setShowAudience] = useState(false);
  const [pendingHide, setPendingHide] = useState<boolean | null>(null);
  const [confirmReady, setConfirmReady] = useState(false);

  useEffect(() => {
    if (pendingHide == null) {
      setConfirmReady(false);
      return;
    }
    const t = window.setTimeout(() => setConfirmReady(true), 280);
    return () => window.clearTimeout(t);
  }, [pendingHide]);

  const hasLimits =
    excludePersonIds.length > 0 ||
    excludeRelationTypes.length > 0 ||
    hideIdentity;
  const [extrasOpen, setExtrasOpen] = useState(hasLimits);

  const excludedPeople = useMemo(
    () => circle.filter((p) => excludePersonIds.includes(p.id)),
    [circle, excludePersonIds],
  );
  const matches = useMemo(() => {
    const q = query.trim();
    return circle
      .filter((p) => !excludePersonIds.includes(p.id))
      .filter((p) => !q || p.name.includes(q))
      .slice(0, 8);
  }, [circle, excludePersonIds, query]);

  const summary = listingPrivacySummary({
    privacy,
    hideIdentity,
    excludePersonNames: excludedPeople.map((p) => p.name),
    excludeRelationTypes,
  });

  const widened =
    initialPrivacy != null &&
    (audienceIsWider(initialPrivacy, privacy) ||
      (initialExcludePersonIds ?? []).some(
        (id) => !excludePersonIds.includes(id),
      ) ||
      (initialExcludeRelationTypes ?? []).some(
        (type) => !excludeRelationTypes.includes(type),
      ));

  function toggleRelation(type: RelationType) {
    onExcludeRelationTypes(
      excludeRelationTypes.includes(type)
        ? excludeRelationTypes.filter((row) => row !== type)
        : [...excludeRelationTypes, type],
    );
  }

  const extraCount =
    excludePersonIds.length + excludeRelationTypes.length + (hideIdentity ? 1 : 0);

  return (
    <section className="mb-5">
      <p className="text-[15px] font-semibold text-ink dark:text-zinc-200 mb-3">
        حریم خصوصی آگهی
      </p>

      <PrivacyPicker value={privacy} onChange={onPrivacy} compact />

      <div className="mt-3 rounded-xl bg-stone-50 dark:bg-zinc-800/60 px-3 py-2.5 space-y-1">
        <button
          type="button"
          onClick={() => setShowAudience(true)}
          className="block w-full text-right text-[12.5px] font-semibold text-brand-600 dark:text-brand-400 leading-relaxed"
        >
          {listingAudienceLine(privacy)}
        </button>
        {summary
          .filter((line) => line !== listingAudienceLine(privacy))
          .map((line) => (
            <p
              key={line}
              className="text-[12.5px] text-ink-muted dark:text-zinc-300 leading-relaxed"
            >
              {line}
            </p>
          ))}
      </div>

      <button
        type="button"
        aria-expanded={extrasOpen}
        onClick={() => setExtrasOpen((v) => !v)}
        className="mt-3 min-h-11 w-full flex items-center justify-between gap-2 text-right text-[12.5px] font-semibold text-brand-600 dark:text-brand-400 rounded-xl active:bg-brand-50 dark:active:bg-brand-500/10 px-1 -mx-1"
      >
        <span>
          {extrasOpen
            ? "بستن تنظیمات بیشتر"
            : extraCount > 0
              ? "تنظیمات بیشتر — محدودیت اعمال شده"
              : "تنظیمات بیشتر: پنهان کردن از بعضی‌ها"}
        </span>
        <span aria-hidden className="text-ink-faint font-medium">
          {extrasOpen ? "–" : "+"}
        </span>
      </button>

      {extrasOpen ? (
        <div className="mt-3 space-y-4">
          <div>
            <p className="text-[13.5px] font-semibold text-ink dark:text-zinc-200 mb-1">
              چه کسانی نبینند؟
            </p>
            <p className="text-[11px] text-ink-muted dark:text-zinc-400 mb-2 leading-relaxed">
              خانواده، دوستان یا چند نفر مشخص را از این آگهی جدا کن.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {RELATION_OPTIONS.map((type) => {
                const active = excludeRelationTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleRelation(type)}
                    className={`chip min-h-9 !text-[11px] !py-1.5 border ${
                      active
                        ? "bg-ink text-white border-ink dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                        : "bg-[color:var(--circle-surface)] text-ink-muted border-stone-200/80 dark:bg-zinc-900 dark:border-zinc-700"
                    }`}
                  >
                    {relationLabels[type]}
                  </button>
                );
              })}
            </div>
            {excludedPeople.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {excludedPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() =>
                      onExcludePersonIds(
                        excludePersonIds.filter((id) => id !== person.id),
                      )
                    }
                    className="chip min-h-9 !text-[11px] !py-1.5 bg-ink text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {person.name} ×
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setShowPeople((v) => !v)}
              className="text-[12.5px] font-semibold text-brand-600 dark:text-brand-400 min-h-11"
            >
              {showPeople ? "بستن فهرست" : "چند نفر را انتخاب کن"}
            </button>
            {showPeople ? (
              <div className="mt-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجو در حلقه…"
                  className="field !py-2 !text-[13px] mb-2"
                />
                <ul className="max-h-40 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800 rounded-xl border border-stone-200/70 dark:border-zinc-700">
                  {matches.length === 0 ? (
                    <li className="px-3 py-2 text-[12.5px] text-ink-faint">
                      کسی پیدا نشد
                    </li>
                  ) : (
                    matches.map((person) => (
                      <li key={person.id}>
                        <button
                          type="button"
                          onClick={() =>
                            onExcludePersonIds([...excludePersonIds, person.id])
                          }
                          className="w-full min-h-11 text-right px-3 py-2 text-[13.5px] font-semibold text-ink dark:text-zinc-100"
                        >
                          {person.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 dark:border-zinc-700 px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-ink dark:text-zinc-200 leading-snug">
                نمایش هویت من
              </p>
              <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-0.5 leading-relaxed">
                {hideIdentity
                  ? "آگهی با عنوان «یکی از اعضای سیرکل» دیده می‌شود."
                  : "نام و تصویر پروفایل تو روی آگهی دیده می‌شود."}
              </p>
              {!canHideIdentity ? (
                <p className="text-[11px] text-ink-faint mt-1 leading-relaxed">
                  بعد از نمایش هویت روی آگهی نمی‌توان دوباره پنهان کرد.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!hideIdentity}
              aria-label="نمایش هویت من"
              disabled={!canHideIdentity && !hideIdentity}
              onClick={() => {
                if (!canHideIdentity && !hideIdentity) return;
                setPendingHide(!hideIdentity);
              }}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
                !hideIdentity ? "bg-brand-600" : "bg-stone-300 dark:bg-zinc-600"
              }`}
            >
              <span
                aria-hidden
                className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-150 ease-out ${
                  !hideIdentity ? "start-[calc(100%-25px)]" : "start-[3px]"
                }`}
              />
            </button>
          </div>
        </div>
      ) : null}

      {showAudience ? (
        <ListingAudienceSheet
          privacy={privacy}
          excludePersonIds={excludePersonIds}
          excludeRelationTypes={excludeRelationTypes}
          canChangePrivacy
          onChangePrivacy={() => {
            setExtrasOpen(true);
          }}
          onClose={() => setShowAudience(false)}
        />
      ) : null}
      {pendingHide != null ? (
        <SheetShell
          onClose={() => setPendingHide(null)}
          labelledBy="hide-identity-confirm-title"
          hugContent
          maxHeight="70dvh"
          zClass="z-[80]"
          closeOnBackdrop={confirmReady}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onHideIdentity(pendingHide);
                  setPendingHide(null);
                }}
                className="btn-primary flex-1 !py-3.5"
              >
                {pendingHide ? "پنهان شود" : "هویت دیده شود"}
              </button>
              <button
                type="button"
                onClick={() => setPendingHide(null)}
                className="btn-ghost flex-1 !py-3.5"
              >
                انصراف
              </button>
            </div>
          }
        >
          <h2
            id="hide-identity-confirm-title"
            className="text-[20px] font-extrabold tracking-tight text-ink dark:text-zinc-50"
          >
            {pendingHide ? "هویت پنهان شود؟" : "هویت روی آگهی دیده شود؟"}
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted dark:text-zinc-400">
            {pendingHide
              ? "حلقه آگهی را با عنوان «یکی از اعضای سیرکل» و چهرهٔ مخصوص همین آگهی می‌بیند، نه با نام و عکس پروفایل تو."
              : "نام و تصویر پروفایل تو روی آگهی برای بینندگان نمایش داده می‌شود."}
          </p>
        </SheetShell>
      ) : null}
      {widened ? (
        <p className="mt-2 text-[12.5px] font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
          با این تغییر، افراد بیشتری می‌توانند آگهی را ببینند. کسانی که قبلاً
          دیده‌اند، دیدن قبلی‌شان برنمی‌گردد.
        </p>
      ) : null}
    </section>
  );
}
