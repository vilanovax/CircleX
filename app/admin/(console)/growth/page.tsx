"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ExportKind } from "@/lib/admin-csv";
import { EXPORT_KIND_LABELS } from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import {
  AdminCount,
  AdminSkeleton,
  AdminTabs,
  downloadAdminCsv,
} from "@/components/admin/AdminBits";
import { useToast } from "@/components/Toast";

type DayPoint = {
  day: string;
  label: string;
  users: number;
  listings: number;
  invites: number;
  accepts: number;
};

type Metric = keyof Omit<DayPoint, "day" | "label">;

type Payload = {
  rangeDays: 7 | 14 | 30;
  series: DayPoint[];
  funnel: {
    created: number;
    accepted: number;
    live: number;
    expired: number;
    revoked: number;
  };
  joins: { pending: number; accepted: number; rejected: number };
  totals: {
    users: number;
    listings: number;
    invites: number;
    accepts: number;
  };
};

const METRICS: { key: Metric; label: string }[] = [
  { key: "users", label: "کاربر جدید" },
  { key: "invites", label: "دعوت ساخته‌شده" },
  { key: "accepts", label: "دعوت پذیرفته" },
  { key: "listings", label: "آگهی" },
];

function DayChart({ series, metric }: { series: DayPoint[]; metric: Metric }) {
  const max = Math.max(1, ...series.map((row) => row[metric]));
  const dense = series.length > 16;
  return (
    <div
      className={`admin-bars ${dense ? "is-dense" : ""}`}
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
          <span
            className={`tabular-nums font-medium ${
              value === 0 ? "text-ink-muted" : ""
            }`}
          >
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

export default function AdminGrowthPage() {
  const { show } = useToast();
  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [metric, setMetric] = useState<Metric>("users");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [canExportUsers, setCanExportUsers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api<Payload>(`/api/admin/analytics?days=${days}`);
      setData(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خواندن رشد نشد");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<{ admin: { role: string } }>("/api/admin/auth/me")
      .then((d) => setCanExportUsers(d.admin.role !== "analyst"))
      .catch(() => setCanExportUsers(false));
  }, []);

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

  const exports: ExportKind[] = canExportUsers
    ? ["users", "invites", "reports"]
    : ["invites", "reports"];

  const joinTotal = data
    ? Math.max(1, data.joins.pending + data.joins.accepted + data.joins.rejected)
    : 1;

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">رشد</h1>
          <AdminCount loading={loading}>
            {data
              ? `${toPersianDigits(data.rangeDays)} روز اخیر · تهران`
              : null}
          </AdminCount>
        </div>
        <div className="admin-page-head-actions">
          <AdminTabs
            label="بازه"
            value={String(days)}
            onChange={(next) => setDays(Number(next) as 7 | 14 | 30)}
            items={[
              { key: "7", label: "۷ روز" },
              { key: "14", label: "۱۴ روز" },
              { key: "30", label: "۳۰ روز" },
            ]}
          />
          {data ? (
            <div className="flex flex-wrap gap-1.5">
              {exports.map((kind) => (
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
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-3 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}

      {loading && !data ? (
        <AdminSkeleton rows={9} />
      ) : data ? (
        <>
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
                <p className="admin-kpi-value">
                  {toPersianDigits(data.totals[item.key])}
                </p>
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
        </>
      ) : null}
    </div>
  );
}
