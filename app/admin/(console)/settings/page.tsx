"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  FLAG_HINTS,
  FLAG_LABELS,
} from "@/lib/admin-labels";
import type {
  AppFlags,
  AppSettings,
  CatalogCity,
} from "@/lib/app-settings-types";
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

export default function AdminSettingsPage() {
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("growth");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [draft, setDraft] = useState<AppSettings | null>(null);
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

  if (loading) {
    return (
      <div>
        <h1 className="mb-4 text-[20px] font-semibold">تنظیمات زنده</h1>
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
          <h1 className="text-[20px] font-semibold">تنظیمات زنده</h1>
          <p className="mt-1 text-[12.5px] text-ink-faint">
            {canWrite
              ? "این مقادیر همان لحظه روی اپ اعمال می‌شوند."
              : "فقط مدیر کل می‌تواند ذخیره کند — اینجا فقط خواندنی است."}
          </p>
        </div>
        {savedAt ? (
          <p className="shrink-0 text-[12px] text-ink-faint">
            آخرین ذخیره: {faAdminDate(savedAt)}
          </p>
        ) : null}
      </div>

      <AdminTabs
        label="بخش‌های تنظیمات"
        value={tab}
        onChange={goTab}
        items={TABS}
        className="mb-4"
      />

      {tab === "growth" ? (
        <section className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="عمر لینک دعوت"
            hint="بین ۱ تا ۳۰ روز"
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
          <NumberField
            label="سقف لینک گروهی"
            hint="بین ۲ تا ۲۰ نفر"
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
        <section className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="عمر کد ورود"
            hint="بین ۱ تا ۱۵ دقیقه"
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
          <NumberField
            label="سقف تلاش اشتباه"
            hint="بین ۳ تا ۱۰ بار"
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
                  {toPersianDigits(enabledCities)} شهر فعال از{" "}
                  {toPersianDigits(draft.catalog.cities.length)}
                </p>
              </div>
              {canWrite ? (
                <button
                  type="button"
                  className="admin-btn rounded-xl bg-brand-50 px-3 py-1.5 text-[12.5px] text-brand-700"
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
            <h2 className="mb-2 text-[14px] font-medium">دسته‌ها</h2>
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
                  className="admin-btn shrink-0 rounded-xl bg-brand-50 px-3 py-2 text-[12.5px] text-brand-700"
                >
                  افزودن
                </button>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "flags" ? (
        <section className="admin-panel grid divide-y divide-black/5 dark:divide-white/10 lg:grid-cols-2 lg:divide-y-0">
          {FLAG_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 border-black/5 px-4 py-3.5 lg:border-b dark:border-white/10"
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
            تغییرات ذخیره نشده
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="admin-btn rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NumberField({
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
    <label className="admin-panel flex items-center justify-between gap-4 p-4">
      <span>
        <span className="block text-[14px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[12px] text-ink-faint">{hint}</span>
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          dir="ltr"
          onChange={(e) => onChange(Number(e.target.value))}
          className="admin-input w-[4.5rem] text-center text-[16px] font-semibold tabular-nums"
        />
        <span className="text-[12px] text-ink-muted">{unit}</span>
      </span>
    </label>
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
        <label className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-ink-muted">
          <input
            type="checkbox"
            className="accent-brand-600"
            checked={city.enabled}
            disabled={disabled}
            onChange={(e) => onChange({ ...city, enabled: e.target.checked })}
          />
          فعال
        </label>
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
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
