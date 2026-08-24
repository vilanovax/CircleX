"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ExportKind } from "@/lib/admin-csv";
import { EXPORT_KIND_LABELS } from "@/lib/admin-labels";
import { faDayLong } from "@/lib/admin-day";
import type { AdminAnalytics, AdminDayPoint } from "@/lib/admin-metrics";
import { toPersianDigits } from "@/lib/persian";
import { downloadAdminCsv } from "@/components/admin/AdminBits";
import { useToast } from "@/components/Toast";

type Metric = keyof Omit<AdminDayPoint, "day" | "label">;

const METRICS: { key: Metric; label: string; hint: string }[] = [
  { key: "users", label: "کاربر جدید", hint: "حساب ساخته‌شده در این بازه" },
  { key: "invites", label: "دعوت ساخته‌شده", hint: "دعوت صادرشده در این بازه" },
  { key: "accepts", label: "پذیرش ثبت‌شده", hint: "تاریخ پذیرش در این بازه؛ دعوت می‌تواند قدیمی‌تر باشد" },
  { key: "listings", label: "آگهی ساخته‌شده", hint: "هر آگهی جدید، حتی غیرفعال" },
];

const RANGES: { days: 7 | 14 | 30; label: string }[] = [
  { days: 7, label: "۷ روز" },
  { days: 14, label: "۱۴ روز" },
  { days: 30, label: "۳۰ روز" },
];

function rangeHref(days: 7 | 14 | 30): string {
  return days === 14 ? "/admin/growth" : `/admin/growth?days=${days}`;
}

function defaultMetric(totals: AdminAnalytics["totals"]): Metric {
  const order: Metric[] = ["users", "invites", "accepts", "listings"];
  return order.find((key) => totals[key] > 0) ?? "users";
}

function rate(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

function DayChart({ series, metric }: { series: AdminDayPoint[]; metric: Metric }) {
  const max = Math.max(1, ...series.map((row) => row[metric]));
  const dense = series.length > 16;
  const empty = series.every((row) => row[metric] === 0);
  return (
    <div>
      <p className="mb-2 text-[11px] text-ink-faint">
        محور زمان از چپ به راست است · چپ شروع بازه · راست امروز تهران
      </p>
      <div
        className={`admin-bars h-[13rem] shrink-0 ${dense ? "is-dense" : ""}`}
        style={{ flex: "0 0 auto" }}
        dir="ltr"
        role="img"
        aria-label="نمودار روزانه از شروع بازه تا امروز"
      >
        {series.map((row) => {
          const value = row[metric];
          const pct = Math.round((value / max) * 100);
          return (
            <div
              key={row.day}
              className="admin-bar"
              title={`${faDayLong(row.day)}: ${toPersianDigits(value)}`}
            >
              <span className="admin-bar-value">
                {value > 0 ? toPersianDigits(value) : "\u00a0"}
              </span>
              <div className="admin-bar-track">
                <div
                  className="admin-bar-fill"
                  style={{ height: `${Math.max(value > 0 ? 8 : 3, pct)}%` }}
                />
              </div>
              <span className="admin-bar-label">{row.label}</span>
            </div>
          );
        })}
      </div>
      {empty ? (
        <p className="mt-1.5 text-[12px] text-ink-faint">در این بازه برای این معیار موردی نبود</p>
      ) : null}
    </div>
  );
}

function FunnelRow({
  label,
  hint,
  value,
  total,
}: {
  label: string;
  hint?: string;
  value: number;
  total: number;
}) {
  const width = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className={value === 0 ? "admin-funnel-row is-zero" : "admin-funnel-row"}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
        <span>
          <span className="block">{label}</span>
          {hint ? <span className="mt-0.5 block text-[11px] text-ink-faint">{hint}</span> : null}
        </span>
        <span className="flex shrink-0 items-baseline gap-2">
          {total > 0 && value !== total ? (
            <span className="text-[11px] tabular-nums text-ink-muted">
              {toPersianDigits(width)}٪
            </span>
          ) : null}
          <span className={`tabular-nums font-medium ${value === 0 ? "text-ink-muted" : ""}`}>
            {toPersianDigits(value)}
          </span>
        </span>
      </div>
      <div className="admin-funnel-track">
        <div
          className="admin-funnel-fill"
          style={{ width: `${value > 0 ? Math.max(width, 3) : 0}%` }}
        />
      </div>
    </div>
  );
}

export function GrowthClient({
  data,
  canExportUsers,
}: {
  data: AdminAnalytics;
  canExportUsers: boolean;
}) {
  const { show } = useToast();
  const [metric, setMetric] = useState<Metric>(() => defaultMetric(data.totals));
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [exportsOpen, setExportsOpen] = useState(false);

  useEffect(() => {
    setMetric(defaultMetric(data.totals));
  }, [data.rangeDays, data.totals.users, data.totals.invites, data.totals.accepts, data.totals.listings]);

  async function exportKind(kind: ExportKind) {
    if (kind === "users" && !canExportUsers) return;
    setExporting(kind);
    try {
      await downloadAdminCsv(kind);
      show("فایل CSV آماده شد");
    } catch (err) {
      show(err instanceof Error ? err.message : "خروجی گرفته نشد");
    } finally {
      setExporting(null);
    }
  }

  const exportKinds: ExportKind[] = canExportUsers
    ? ["users", "invites", "reports", "message-reports"]
    : ["invites", "reports", "message-reports"];

  const metricMeta = METRICS.find((item) => item.key === metric) ?? METRICS[0];
  const firstDay = data.series[0]?.day;
  const lastDay = data.series[data.series.length - 1]?.day;
  const rangeCopy =
    firstDay && lastDay
      ? `${toPersianDigits(data.rangeDays)} روز تقویم تهران · ${faDayLong(firstDay)} تا ${faDayLong(lastDay)}`
      : `${toPersianDigits(data.rangeDays)} روز تقویم تهران`;

  const peak = useMemo(() => {
    let best = data.series[0];
    for (const row of data.series) {
      if (!best || row[metric] > best[metric]) best = row;
    }
    return best;
  }, [data.series, metric]);

  const activeDays = useMemo(
    () =>
      [...data.series]
        .filter((row) => row[metric] > 0)
        .sort((a, b) => b[metric] - a[metric]),
    [data.series, metric],
  );

  const avg = data.rangeDays > 0 ? data.totals[metric] / data.rangeDays : 0;
  const funnelAccept = rate(data.funnel.accepted, data.funnel.created);
  const funnelSettled =
    data.funnel.accepted + data.funnel.live + data.funnel.expired + data.funnel.revoked;
  const joinDecided = data.joins.accepted + data.joins.rejected;

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">رشد</h1>
          <p className="text-[13px] text-ink-faint">{rangeCopy}</p>
        </div>
        <div className="admin-page-head-actions">
          <div
            className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]"
            role="tablist"
            aria-label="بازه"
          >
            {RANGES.map((range) => {
              const active = data.rangeDays === range.days;
              return (
                <Link
                  key={range.days}
                  href={rangeHref(range.days)}
                  prefetch
                  scroll={false}
                  role="tab"
                  aria-selected={active}
                  className={`admin-btn shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] ${
                    active
                      ? "bg-[var(--circle-surface)] font-medium shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {range.label}
                </Link>
              );
            })}
          </div>
          <div className="relative">
            <button
              type="button"
              aria-expanded={exportsOpen}
              onClick={() => setExportsOpen((open) => !open)}
              className="admin-btn rounded-xl border border-black/10 px-3 py-1.5 text-[12.5px] dark:border-white/15"
            >
              خروجی CSV
            </button>
            {exportsOpen ? (
              <div className="absolute left-0 top-full z-20 mt-1.5 w-[16.5rem] rounded-xl border border-black/10 bg-[var(--circle-surface)] p-2 shadow-lg dark:border-white/15">
                <p className="px-2 pb-2 text-[11px] leading-relaxed text-ink-faint">
                  کل سامانه است، نه این بازه. حداکثر پنج‌هزار ردیف، با BOM برای اکسل.
                </p>
                <div className="flex flex-col gap-1">
                  {exportKinds.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      disabled={exporting !== null}
                      onClick={() => void exportKind(kind)}
                      className="admin-btn rounded-lg px-2.5 py-1.5 text-right text-[12.5px] hover:bg-black/[0.04] disabled:opacity-50 dark:hover:bg-white/[0.06]"
                    >
                      {exporting === kind
                        ? "در حال ساخت…"
                        : EXPORT_KIND_LABELS[kind]}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mb-2 text-[12.5px] text-ink-muted">
        کارت را بزن تا نمودار همان معیار را نشان بدهد.
      </p>
      <div className="admin-kpi-grid" role="tablist" aria-label="معیار نمودار">
        {METRICS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={metric === item.key}
            title={item.hint}
            onClick={() => setMetric(item.key)}
            className={`admin-kpi ${metric === item.key ? "is-on" : ""}`}
          >
            <p className="admin-kpi-value">{toPersianDigits(data.totals[item.key])}</p>
            <p className="admin-kpi-label">{item.label}</p>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-ink-faint">{metricMeta.hint}</p>

      <dl className="admin-panel mb-4 mt-3 grid gap-2 px-4 py-3 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="text-[11px] text-ink-faint">میانگین روزانه</dt>
          <dd className="tabular-nums font-medium">{toPersianDigits(Number(avg.toFixed(1)))}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-faint">اوج {metricMeta.label}</dt>
          <dd className="font-medium">
            {peak && peak[metric] > 0
              ? `${faDayLong(peak.day)} · ${toPersianDigits(peak[metric])}`
              : "اوجی نبود"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-faint">پذیرش دعوت همین بازه</dt>
          <dd className="font-medium">
            {funnelAccept == null
              ? "دعوتی ساخته نشد"
              : `${toPersianDigits(data.funnel.accepted)} از ${toPersianDigits(data.funnel.created)} · ${toPersianDigits(funnelAccept)}٪`}
          </dd>
        </div>
      </dl>
      {data.totals.accepts !== data.funnel.accepted ? (
        <p className="mb-4 text-[12px] text-ink-muted">
          پذیرش ثبت‌شده در نمودار ({toPersianDigits(data.totals.accepts)}) با پذیرش دعوت‌های
          ساخته‌شده در همین بازه ({toPersianDigits(data.funnel.accepted)}) یکی نیست؛ اولی تاریخ
          پذیرش را می‌شمارد، دومی وضعیت فعلی دعوت‌های جدید این بازه را.
        </p>
      ) : null}

      <div className="admin-growth-grid">
        <section className="admin-panel p-4">
          <h2 className="mb-1 text-[14px] font-medium">روزبه‌روز · {metricMeta.label}</h2>
          <DayChart series={data.series} metric={metric} />
          {activeDays.length > 0 ? (
            <div className="mt-4 border-t border-black/5 pt-3 dark:border-white/10">
              <h3 className="mb-2 text-[12.5px] font-medium">روزهای با عدد، از پرتعداد</h3>
              <ul className="grid gap-1.5 text-[13px]">
                {activeDays.slice(0, 8).map((row) => (
                  <li key={row.day} className="flex justify-between gap-3">
                    <span className="text-ink-muted">{faDayLong(row.day)}</span>
                    <span className="tabular-nums font-medium">{toPersianDigits(row[metric])}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <div className="admin-growth-side">
          <section className="admin-panel p-4">
            <h2 className="mb-1 text-[14px] font-medium">قیف دعوت این بازه</h2>
            <p className="mb-3 text-[12px] leading-relaxed text-ink-faint">
              فقط دعوت‌هایی که در این بازه ساخته شده‌اند. درصد نسبت به همان ساخته‌شده است.
              «هنوز زنده» یعنی الان در انتظار، نه تعداد پذیرش روزانه.
            </p>
            <div className="admin-funnel">
              <FunnelRow
                label="ساخته‌شده"
                value={data.funnel.created}
                total={data.funnel.created}
              />
              <FunnelRow
                label="پذیرفته"
                hint="وضعیت فعلی accepted"
                value={data.funnel.accepted}
                total={data.funnel.created}
              />
              <FunnelRow
                label="هنوز زنده"
                hint="pending و هنوز منقضی نشده"
                value={data.funnel.live}
                total={data.funnel.created}
              />
              <FunnelRow
                label="منقضی"
                value={data.funnel.expired}
                total={data.funnel.created}
              />
              <FunnelRow
                label="لغو شده"
                value={data.funnel.revoked}
                total={data.funnel.created}
              />
            </div>
            {data.funnel.created > 0 && funnelSettled !== data.funnel.created ? (
              <p className="mt-3 text-[11px] text-ink-muted">
                جمع وضعیت‌ها {toPersianDigits(funnelSettled)} است، ساخته‌شده{" "}
                {toPersianDigits(data.funnel.created)}.
              </p>
            ) : null}
          </section>
          <section className="admin-panel p-4">
            <h2 className="mb-1 text-[14px] font-medium">پیوستن به حلقه</h2>
            <p className="mb-3 text-[12px] leading-relaxed text-ink-faint">
              صف باز مال همین لحظه است. پذیرفته و رد فقط تصمیم‌های همین بازه را می‌شمارند.
            </p>
            <p className="flex items-baseline justify-between text-[13px]">
              <span>صف باز الان</span>
              <span className="tabular-nums font-medium">{toPersianDigits(data.joins.pending)}</span>
            </p>
            <p className="mt-3 text-[11px] text-ink-faint">تصمیم در این بازه</p>
            <p className="mt-1 flex items-baseline justify-between text-[13px]">
              <span>پذیرفته</span>
              <span className="tabular-nums font-medium">{toPersianDigits(data.joins.accepted)}</span>
            </p>
            <p className="mt-2 flex items-baseline justify-between text-[13px]">
              <span>رد شده</span>
              <span className="tabular-nums font-medium">{toPersianDigits(data.joins.rejected)}</span>
            </p>
            {joinDecided === 0 ? (
              <p className="mt-3 text-[12px] text-ink-faint">در این بازه تصمیمی ثبت نشد.</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
