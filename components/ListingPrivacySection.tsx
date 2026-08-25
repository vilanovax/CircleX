"use client";

import { useMemo, useState } from "react";
import PrivacyPicker from "@/components/PrivacyPicker";
import { activeCircle } from "@/lib/circle-member";
import {
  audienceIsWider,
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

  const excludedPeople = circle.filter((p) => excludePersonIds.includes(p.id));
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

  return (
    <section className="mb-5 rounded-2xl border border-stone-200/80 dark:border-zinc-700 px-3.5 py-3.5">
      <p className="text-[13px] font-bold text-ink dark:text-zinc-200 mb-3">
        حریم خصوصی آگهی
      </p>

      <PrivacyPicker value={privacy} onChange={onPrivacy} compact />

      <div className="mt-4">
        <p className="text-[13px] font-bold text-ink dark:text-zinc-200 mb-1.5">
          چه کسانی نبینند؟
        </p>
        <p className="text-[11px] text-ink-muted dark:text-zinc-400 mb-2 leading-relaxed">
          این آگهی به چه کسانی نشان داده نشود؟
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {RELATION_OPTIONS.map((type) => {
            const active = excludeRelationTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleRelation(type)}
                className={`chip !text-[11px] !py-1 ${
                  active
                    ? "bg-stone-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-stone-100 text-ink-muted dark:bg-zinc-800"
                }`}
              >
                {relationLabels[type]} نبینند
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
                className="chip !text-[11px] !py-1 bg-stone-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {person.name} نبینند ×
              </button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          className="text-[12px] font-semibold text-brand-600 dark:text-brand-400"
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
                <li className="px-3 py-2 text-[12px] text-ink-faint">
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
                      className="w-full text-right px-3 py-2 text-[13px] font-semibold text-ink dark:text-zinc-100"
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

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink dark:text-zinc-200">
            نمایش هویت من
          </p>
          <p className="text-[11px] text-ink-muted dark:text-zinc-400 mt-1 leading-relaxed">
            {hideIdentity
              ? "آگهی با عنوان «یکی از اعضای سیرکل» و تصویر عمومی نمایش داده می‌شود. سیرکل هویت تو را برای حفظ امنیت می‌داند."
              : "نام و تصویر تو روی آگهی دیده می‌شود."}
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
          aria-checked={hideIdentity}
          disabled={!canHideIdentity && !hideIdentity}
          onClick={() => {
            if (!canHideIdentity && !hideIdentity) return;
            onHideIdentity(!hideIdentity);
          }}
          className={`shrink-0 w-11 h-7 rounded-full transition-colors ${
            hideIdentity ? "bg-brand-600" : "bg-stone-300 dark:bg-zinc-600"
          } disabled:opacity-40`}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white shadow mt-1 transition-transform ${
              hideIdentity ? "-translate-x-5" : "-translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="mt-4 rounded-xl bg-stone-50 dark:bg-zinc-800/60 px-3 py-2.5 space-y-1">
        {summary.map((line) => (
          <p
            key={line}
            className="text-[12px] text-ink-muted dark:text-zinc-300 leading-relaxed"
          >
            {line}
          </p>
        ))}
      </div>
      {widened ? (
        <p className="mt-2 text-[12px] font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
          با این تغییر، افراد بیشتری می‌توانند آگهی را ببینند. کسانی که قبلاً
          دیده‌اند، دیدن قبلی‌شان برنمی‌گردد.
        </p>
      ) : null}
    </section>
  );
}
