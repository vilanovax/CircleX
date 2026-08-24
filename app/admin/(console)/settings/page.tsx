"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { FLAG_HINTS, FLAG_LABELS } from "@/lib/admin-labels";
import type { AppFlags, AppSettings, CatalogCity } from "@/lib/app-settings-types";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import {
  AdminSkeleton,
  AdminTabs,
  AdminSwitch,
  faAdminDate,
} from "@/components/admin/AdminBits";

type Tab = "growth" | "auth" | "catalog" | "flags";

const TABS: { key: Tab; label: string }[] = [
  { key: "growth", label: "رشد و دعوت" },
  { key: "auth", label: "احراز" },
  { key: "catalog", label: "شهر و دسته" },
  { key: "flags", label: "فلگ‌ها" },
];

const TAB_HINT: Record<Tab, string> = {
  growth: "عمر لینک دعوت و سقف استفاده از لینک گروهی.",
  auth: "مهلت و سقف تلاش کد ورود پیامکی.",
  catalog: "شهرها، منطقه، محله و دسته‌های آگهی.",
  flags: "روشن و خاموش کردن قابلیت‌های اپ.",
};

const FLAG_KEYS: (keyof AppFlags)[] = [
  "aiPolish",
  "waveInvites",
  "requests",
  "events",
  "listingReports",
  "watches",
];

function isTab(value: string | null): value is Tab {
  return (
    value === "growth" ||
    value === "auth" ||
    value === "catalog" ||
    value === "flags"
  );
}

type Payload = {
  settings: AppSettings;
  viewer: { role: string; canWrite: boolean };
};

function linesOf(items: string[]): string {
  return items.join("\n");
}

function snapshotOf(settings: AppSettings): string {
  return JSON.stringify({
    flags: settings.flags,
    growth: settings.growth,
    auth: settings.auth,
    catalog: settings.catalog,
  });
}

function parseLines(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\n|,/)
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter((item) => item.length >= 2),
    ),
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export default function AdminSettingsPage() {
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("growth");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState<AppSettings | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [baseline, setBaseline] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Payload>("/api/admin/settings");
      setDraft(data.settings);
      setSaved(data.settings);
      setSavedAt(data.settings.updatedAt);
      setCanWrite(data.viewer.canWrite);
      setBaseline(snapshotOf(data.settings));
      setDirty(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تنظیمات خوانده نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get("tab");
    if (isTab(next)) setTab(next);
  }, []);

  function goTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function patch(next: AppSettings) {
    setDraft(next);
    setDirty(snapshotOf(next) !== baseline);
  }

  function discard() {
    if (!saved) return;
    setDraft(saved);
    setDirty(false);
    setCategoryDraft("");
  }

  async function save() {
    if (!draft || !canWrite || saving) return;
    setSaving(true);
    try {
      const data = await api<{ settings: AppSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          flags: draft.flags,
          growth: draft.growth,
          auth: draft.auth,
          catalog: draft.catalog,
        }),
      });
      setDraft(data.settings);
      setSaved(data.settings);
      setSavedAt(data.settings.updatedAt);
      setBaseline(snapshotOf(data.settings));
      setDirty(false);
      show("تنظیمات ذخیره شد");
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ذخیره نشد");
    } finally {
      setSaving(false);
    }
  }

  const enabledCities = useMemo(
    () => draft?.catalog.cities.filter((c) => c.enabled).length ?? 0,
    [draft],
  );
  const flagsOn = useMemo(
    () => (draft ? FLAG_KEYS.filter((key) => draft.flags[key]).length : 0),
    [draft],
  );

  if (loading) {
    return (
      <div>
        <h1 className="mb-4 text-[20px] font-semibold">تنظیمات</h1>
        <AdminSkeleton rows={9} />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <p role="alert" className="text-[13px] text-red-600">
        {error ?? "تنظیمات در دسترس نیست"}
      </p>
    );
  }

  return (
    <div className={canWrite && dirty ? "pb-20" : undefined}>
      <div className="admin-page-head">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold">تنظیمات</h1>
          <p className="mt-1 text-[13px] text-ink-faint">
            {canWrite
              ? dirty
                ? "تغییرات روی اپ نمی‌روند تا ذخیره کنی."
                : "بعد از ذخیره روی اپ می‌نشیند."
              : "فقط مدیر کل می‌تواند ذخیره کند — اینجا خواندنی است."}
          </p>
        </div>
        <p className="shrink-0 text-[12px] text-ink-faint">
          {dirty ? "ذخیره نشده" : savedAt ? `آخرین ذخیره: ${faAdminDate(savedAt)}` : "هنوز ذخیره نشده"}
        </p>
      </div>

      <AdminTabs
        label="بخش‌های تنظیمات"
        value={tab}
        onChange={goTab}
        items={TABS}
        className="mb-2"
      />
      <p className="mb-4 text-[12.5px] text-ink-muted">{TAB_HINT[tab]}</p>

      {tab === "growth" ? (
        <section className="admin-panel overflow-hidden">
          <p className="px-4 py-3 text-[13px] text-ink-muted">
            لینک دعوت {toPersianDigits(draft.growth.inviteTtlDays)} روز زنده است · لینک
            گروهی تا {toPersianDigits(draft.growth.waveMaxUses)} نفر
          </p>
          <NumberRow
            label="عمر لینک دعوت"
            hint="بعد از این مدت لینک شخصی منقضی می‌شود. بین ۱ تا ۳۰ روز."
            unit="روز"
            value={draft.growth.inviteTtlDays}
            min={1}
            max={30}
            disabled={!canWrite}
            onChange={(inviteTtlDays) =>
              patch({
                ...draft,
                growth: { ...draft.growth, inviteTtlDays },
              })
            }
          />
          <NumberRow
            label="سقف لینک گروهی"
            hint="چند نفر می‌توانند با یک لینک موجی وارد شوند. بین ۲ تا ۲۰."
            unit="نفر"
            value={draft.growth.waveMaxUses}
            min={2}
            max={20}
            disabled={!canWrite}
            onChange={(waveMaxUses) =>
              patch({
                ...draft,
                growth: { ...draft.growth, waveMaxUses },
              })
            }
          />
        </section>
      ) : null}

      {tab === "auth" ? (
        <section className="admin-panel overflow-hidden">
          <p className="px-4 py-3 text-[13px] text-ink-muted">
            کد ورود {toPersianDigits(draft.auth.otpTtlMinutes)} دقیقه معتبر است · بعد از{" "}
            {toPersianDigits(draft.auth.otpMaxAttempts)} تلاش اشتباه قفل می‌شود
          </p>
          <NumberRow
            label="عمر کد ورود"
            hint="مهلت استفاده از کد پیامک. بین ۱ تا ۱۵ دقیقه."
            unit="دقیقه"
            value={draft.auth.otpTtlMinutes}
            min={1}
            max={15}
            disabled={!canWrite}
            onChange={(otpTtlMinutes) =>
              patch({
                ...draft,
                auth: { ...draft.auth, otpTtlMinutes },
              })
            }
          />
          <NumberRow
            label="سقف تلاش اشتباه"
            hint="بعد از این تعداد، ورود قفل می‌شود. بین ۳ تا ۱۰ بار."
            unit="بار"
            value={draft.auth.otpMaxAttempts}
            min={3}
            max={10}
            disabled={!canWrite}
            onChange={(otpMaxAttempts) =>
              patch({
                ...draft,
                auth: { ...draft.auth, otpMaxAttempts },
              })
            }
          />
        </section>
      ) : null}

      {tab === "catalog" ? (
        <div className="space-y-4">
          <section className="admin-panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-medium">شهرها</h2>
                <p className="text-[12px] text-ink-faint">
                  {toPersianDigits(enabledCities)} فعال از{" "}
                  {toPersianDigits(draft.catalog.cities.length)}
                </p>
              </div>
              {canWrite ? (
                <button
                  type="button"
                  className="admin-btn rounded-xl border border-black/10 px-3 py-1.5 text-[12.5px] dark:border-white/15"
                  onClick={() =>
                    patch({
                      ...draft,
                      catalog: {
                        ...draft.catalog,
                        cities: [
                          ...draft.catalog.cities,
                          {
                            name: "",
                            enabled: true,
                            regions: [],
                            hoods: [],
                          },
                        ],
                      },
                    })
                  }
                >
                  شهر جدید
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {draft.catalog.cities.map((city, index) => (
                <CityCard
                  key={`${city.name}-${index}`}
                  city={city}
                  disabled={!canWrite}
                  onChange={(next) => {
                    const cities = draft.catalog.cities.slice();
                    cities[index] = next;
                    patch({
                      ...draft,
                      catalog: { ...draft.catalog, cities },
                    });
                  }}
                  onRemove={
                    canWrite
                      ? () => {
                          const cities = draft.catalog.cities.filter(
                            (_, i) => i !== index,
                          );
                          patch({
                            ...draft,
                            catalog: { ...draft.catalog, cities },
                          });
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </section>

          <section className="admin-panel p-4">
            <h2 className="text-[14px] font-medium">دسته‌ها</h2>
            <p className="mb-2 text-[12px] text-ink-faint">
              {toPersianDigits(draft.catalog.categories.length)} دسته در آگهی
            </p>
            <div className="flex flex-wrap gap-1.5">
              {draft.catalog.categories.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-full bg-black/[0.05] px-2.5 py-1 text-[12px] dark:bg-white/[0.08]"
                >
                  {item}
                  {canWrite ? (
                    <button
                      type="button"
                      aria-label={`حذف ${item}`}
                      className="text-ink-faint hover:text-red-600"
                      onClick={() =>
                        patch({
                          ...draft,
                          catalog: {
                            ...draft.catalog,
                            categories: draft.catalog.categories.filter(
                              (c) => c !== item,
                            ),
                          },
                        })
                      }
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
            {canWrite ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = categoryDraft.replace(/\s+/g, " ").trim();
                  if (name.length < 2) return;
                  if (draft.catalog.categories.includes(name)) {
                    setCategoryDraft("");
                    return;
                  }
                  patch({
                    ...draft,
                    catalog: {
                      ...draft.catalog,
                      categories: [...draft.catalog.categories, name],
                    },
                  });
                  setCategoryDraft("");
                }}
              >
                <input
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                  className="admin-input"
                  placeholder="دسته جدید"
                />
                <button
                  type="submit"
                  className="admin-btn shrink-0 rounded-xl border border-black/10 px-3 py-2 text-[12.5px] dark:border-white/15"
                >
                  افزودن
                </button>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "flags" ? (
        <section className="admin-panel overflow-hidden">
          <p className="px-4 py-3 text-[13px] text-ink-muted">
            {toPersianDigits(flagsOn)} از {toPersianDigits(FLAG_KEYS.length)} قابلیت روشن است
          </p>
          {FLAG_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 border-t border-black/5 px-4 py-3.5 first:border-t-0 dark:border-white/10"
            >
              <span>
                <span className="block text-[14px]">{FLAG_LABELS[key]}</span>
                <span className="mt-0.5 block text-[12px] text-ink-faint">
                  {FLAG_HINTS[key]}
                </span>
              </span>
              <AdminSwitch
                checked={draft.flags[key]}
                disabled={!canWrite}
                label={FLAG_LABELS[key]}
                onChange={(next) =>
                  patch({
                    ...draft,
                    flags: { ...draft.flags, [key]: next },
                  })
                }
              />
            </div>
          ))}
        </section>
      ) : null}

      {canWrite && dirty ? (
        <div className="admin-savebar">
          <p className="min-w-0 text-[12.5px] text-ink-muted">
            تغییرات ذخیره نشده — هنوز روی اپ نرفته
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={discard}
              className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[13px] dark:border-white/15"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="admin-btn rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {saving ? "در حال ذخیره…" : "ذخیره"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NumberRow({
  label,
  hint,
  unit,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-4 py-3.5 dark:border-white/10">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">{label}</p>
        <p className="mt-0.5 text-[12px] text-ink-faint">{hint}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || value <= min}
          aria-label="کم کردن"
          onClick={() => onChange(clamp(value - 1, min, max))}
          className="admin-btn h-9 w-9 rounded-lg border border-black/10 text-[15px] disabled:opacity-40 dark:border-white/15"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          dir="ltr"
          onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
          className="admin-input h-9 w-[3.5rem] px-1 text-center text-[15px] font-semibold tabular-nums"
        />
        <button
          type="button"
          disabled={disabled || value >= max}
          aria-label="زیاد کردن"
          onClick={() => onChange(clamp(value + 1, min, max))}
          className="admin-btn h-9 w-9 rounded-lg border border-black/10 text-[15px] disabled:opacity-40 dark:border-white/15"
        >
          +
        </button>
        <span className="w-8 text-[12px] text-ink-muted">{unit}</span>
      </div>
    </div>
  );
}

function CityCard({
  city,
  disabled,
  onChange,
  onRemove,
}: {
  city: CatalogCity;
  disabled: boolean;
  onChange: (next: CatalogCity) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-black/8 p-3 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={city.name}
          disabled={disabled}
          onChange={(e) => onChange({ ...city, name: e.target.value })}
          className="admin-input min-w-[8rem] flex-1 font-medium"
          placeholder="نام شهر"
        />
        <AdminSwitch
          checked={city.enabled}
          disabled={disabled}
          label={`فعال بودن ${city.name || "شهر"}`}
          onChange={(enabled) => onChange({ ...city, enabled })}
        />
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="admin-btn shrink-0 text-[12px] text-red-700"
          >
            حذف
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">
        {toPersianDigits(city.regions.length)} منطقه · {toPersianDigits(city.hoods.length)}{" "}
        محله
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-ink-muted">مناطق</span>
          <textarea
            value={linesOf(city.regions)}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...city, regions: parseLines(e.target.value) })
            }
            rows={4}
            className="admin-input resize-y text-[13px]"
            placeholder="هر خط یک منطقه"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-ink-muted">محله‌ها</span>
          <textarea
            value={linesOf(city.hoods)}
            disabled={disabled}
            onChange={(e) =>
              onChange({ ...city, hoods: parseLines(e.target.value) })
            }
            rows={4}
            className="admin-input resize-y text-[13px]"
            placeholder="هر خط یک محله"
          />
        </label>
      </div>
    </div>
  );
}
