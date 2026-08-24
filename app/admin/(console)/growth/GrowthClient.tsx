"use client";

import Link from "next/link";
import { useState } from "react";
import type { ExportKind } from "@/lib/admin-csv";
import { EXPORT_KIND_LABELS } from "@/lib/admin-labels";
import type { AdminAnalytics, AdminDayPoint } from "@/lib/admin-metrics";
import { toPersianDigits } from "@/lib/persian";
import { downloadAdminCsv } from "@/components/admin/AdminBits";
import { useToast } from "@/components/Toast";

type Metric = keyof Omit<AdminDayPoint, "day" | "label">;

const METRICS: { key: Metric; label: string }[] = [
  { key: "users", label: "کاربر جدید" },
  { key: "invites", label: "دعوت ساخته‌شده" },
  { key: "accepts", label: "دعوت پذیرفته" },
  { key: "listings", label: "آگهی" },
];

const RANGES: { days: 7 | 14 | 30; label: string }[] = [
  { days: 7, label: "۷ روز" },
  { days: 14, label: "۱۴ روز" },
  { days: 30, label: "۳۰ روز" },
];

function rangeHref(days: 7 | 14 | 30): string {
  return days === 14 ? "/admin/growth" : `/admin/growth?days=${days}`;
}

function DayChart({ series, metric }: { series: AdminDayPoint[]; metric: Metric }) {
  const max = Math.max(1, ...series.map((row) => row[metric]));
  const dense = series.length > 16;
  const empty = series.every((row) => row[metric] === 0);
  return (
    <div>
      <div
        className={`admin-bars h-[13rem] shrink-0 ${dense ? "is-dense" : ""}`}
        style={{ flex: "0 0 auto" }}
        role="img"
        aria-label="نمودار روزانه"
      >
        {series.map((row) => {
          const value = row[metric];
          const pct = Math.round((value / max) * 100);
          return (
            <div
              key={row.day}
              className="admin-bar"
              title={`${row.label}: ${toPersianDigits(value)}`}
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
        <p className="mt-1.5 text-[12px] text-ink-faint">در این بازه موردی نبود</p>
      ) : null}
    </div>
  );
}

function FunnelRow({
  label,
  value,
  total,
  showRate,
}: {
  label: string;
  value: number;
  total: number;
  showRate?: boolean;
}) {
  const width = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className={value === 0 ? "admin-funnel-row is-zero" : "admin-funnel-row"}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
        <span>{label}</span>
        <span className="flex items-baseline gap-2">
          {showRate && total > 0 && value !== total ? (
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
  const [metric, setMetric] = useState<Metric>("users");
  const [exporting, setExporting] = useState<ExportKind | null>(null);

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
  const joinTotal = Math.max(
    1,
    data.joins.pending + data.joins.accepted + data.joins.rejected,
  );

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">رشد</h1>
          <p className="text-[13px] text-ink-faint">
            {toPersianDigits(data.rangeDays)} روز اخیر · تهران
          </p>
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
          <div className="flex flex-wrap gap-1.5">
            {exportKinds.map((kind) => (
              <button
                key={kind}
                type="button"
                disabled={exporting !== null}
                title="حداکثر پنج‌هزار ردیف، با BOM برای اکسل"
                onClick={() => void exportKind(kind)}
                className="admin-btn rounded-xl border border-black/10 px-2.5 py-1.5 text-[12.5px] hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.05]"
              >
                {exporting === kind
                  ? "در حال ساخت…"
                  : `خروجی ${EXPORT_KIND_LABELS[kind]}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-kpi-grid" role="tablist" aria-label="معیار نمودار">
        {METRICS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={metric === item.key}
            onClick={() => setMetric(item.key)}
            className={`admin-kpi ${metric === item.key ? "is-on" : ""}`}
          >
            <p className="admin-kpi-value">{toPersianDigits(data.totals[item.key])}</p>
            <p className="admin-kpi-label">{item.label}</p>
          </button>
        ))}
      </div>

      <div className="admin-growth-grid">
        <section className="admin-panel p-4">
          <h2 className="mb-3 text-[14px] font-medium">
            روزبه‌روز · {METRICS.find((item) => item.key === metric)?.label}
          </h2>
          <DayChart series={data.series} metric={metric} />
        </section>

        <div className="admin-growth-side">
          <section className="admin-panel p-4">
            <h2 className="mb-3 text-[14px] font-medium">قیف دعوت</h2>
            <div className="admin-funnel">
              <FunnelRow
                label="ساخته‌شده در این بازه"
                value={data.funnel.created}
                total={data.funnel.created}
                showRate
              />
              <FunnelRow
                label="پذیرفته"
                value={data.funnel.accepted}
                total={data.funnel.created}
                showRate
              />
              <FunnelRow
                label="هنوز زنده"
                value={data.funnel.live}
                total={data.funnel.created}
                showRate
              />
              <FunnelRow
                label="منقضی"
                value={data.funnel.expired}
                total={data.funnel.created}
                showRate
              />
              <FunnelRow
                label="لغو شده"
                value={data.funnel.revoked}
                total={data.funnel.created}
                showRate
              />
            </div>
          </section>
          <section className="admin-panel p-4">
            <h2 className="mb-3 text-[14px] font-medium">پیوستن به حلقه</h2>
            <div className="admin-funnel">
              <FunnelRow
                label="صف باز الان"
                value={data.joins.pending}
                total={joinTotal}
              />
              <FunnelRow
                label="پذیرفته در این بازه"
                value={data.joins.accepted}
                total={joinTotal}
              />
              <FunnelRow
                label="رد شده در این بازه"
                value={data.joins.rejected}
                total={joinTotal}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
