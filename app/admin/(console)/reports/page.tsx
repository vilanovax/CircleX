"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import { listingTypeLabels } from "@/lib/labels";
import type { ListingType } from "@/lib/types";
import { AdminSkeleton, faAdminDate, AdminCount, AdminTabs, AdminSwitch, AdminLoadMore, mergeById } from "@/components/admin/AdminBits";

type ReportItem = {
  id: string;
  reason: string;
  note: string | null;
  status: "open" | "reviewed" | "dismissed";
  createdAt: string;
  listing: {
    id: string;
    title: string;
    type: string;
    dealStatus: string | null;
    seller: { id: string; name: string; phone: string };
  };
  reporter: { id: string; name: string; phone: string };
};

type Me = { admin: { role: string } };

const PAGE_SIZE = 50;

export default function AdminReportsPage() {
  const { show } = useToast();
  const [status, setStatus] = useState<"open" | "reviewed" | "dismissed" | "all">(
    "open",
  );
  const [items, setItems] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [reason, setReason] = useState("");
  const [hideListing, setHideListing] = useState(false);
  const [noticeToReporter, setNoticeToReporter] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: ReportItem[]; meta: { total: number } }>(
        `/api/admin/listing-reports?status=${status}&limit=${PAGE_SIZE}&skip=0`,
      );
      setItems(data.items);
      setTotal(data.meta.total);
      setSelected((cur) =>
        cur
          ? data.items.find((r) => r.id === cur.id) ?? data.items[0] ?? null
          : data.items[0] ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خواندن گزارش‌ها نشد");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await api<{ items: ReportItem[]; meta: { total: number } }>(
        `/api/admin/listing-reports?status=${status}&limit=${PAGE_SIZE}&skip=${items.length}`,
      );
      setItems((cur) => mergeById(cur, data.items));
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه فهرست خوانده نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    api<Me>("/api/admin/auth/me")
      .then((d) => {
        setCanWrite(
          d.admin.role === "moderator" || d.admin.role === "superadmin",
        );
      })
      .catch(() => setCanWrite(false));
  }, []);

  useEffect(() => {
    setHideListing(false);
    setNoticeToReporter(true);
    setReason("");
  }, [selected?.id]);

  async function resolve(next: "reviewed" | "dismissed") {
    if (!selected) return;
    setSaving(true);
    try {
      await api(`/api/admin/listing-reports/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: next,
          hideListing,
          noticeToReporter,
          reason,
        }),
      });
      show(next === "reviewed" ? "گزارش بررسی شد" : "گزارش رد شد");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ذخیره نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">گزارش آگهی</h1>
          <AdminCount loading={loading}>
            {toPersianDigits(total)} مورد در این فیلتر
          </AdminCount>
        </div>
        <AdminTabs
          label="وضعیت گزارش"
          value={status}
          onChange={setStatus}
          items={
            [
              { key: "open", label: REPORT_STATUS_LABELS.open },
              { key: "reviewed", label: REPORT_STATUS_LABELS.reviewed },
              { key: "dismissed", label: REPORT_STATUS_LABELS.dismissed },
              { key: "all", label: "همه" },
            ] as const
          }
        />
      </div>

      {error ? (
        <p role="alert" className="mb-3 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}

      {loading && !items.length ? (
        <AdminSkeleton />
      ) : (
        <div className="admin-split">
          <div className="admin-panel admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>آگهی</th>
                  <th>دلیل</th>
                  <th>فروشنده</th>
                  <th className="hidden xl:table-cell">زمان</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const active = selected?.id === row.id;
                  const typeLabel =
                    listingTypeLabels[row.listing.type as ListingType] ??
                    row.listing.type;
                  return (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      aria-selected={active}
                      onClick={() => setSelected(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(row);
                        }
                      }}
                      className={`cursor-pointer ${
                        active ? "bg-brand-50/80 dark:bg-brand-500/10" : ""
                      }`}
                    >
                      <td>
                        <p className="font-medium">{row.listing.title}</p>
                        <p className="text-[11px] text-ink-faint">{typeLabel}</p>
                      </td>
                      <td>{REPORT_REASON_LABELS[row.reason] ?? row.reason}</td>
                      <td>
                        <p>{row.listing.seller.name || "—"}</p>
                        <p
                          className="whitespace-nowrap font-mono text-[11px] text-ink-faint"
                          dir="ltr"
                        >
                          {row.listing.seller.phone}
                        </p>
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-faint xl:table-cell">
                        {faAdminDate(row.createdAt)}
                      </td>
                      <td>{REPORT_STATUS_LABELS[row.status]}</td>
                    </tr>
                  );
                })}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-ink-faint">
                      {status === "open"
                        ? "صف خالی است — گزارش بازی نیست"
                        : "گزارشی در این وضعیت نیست"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <AdminLoadMore
              shown={items.length}
              total={total}
              loading={loadingMore}
              onLoad={() => void loadMore()}
            />
          </div>

          <aside className="admin-panel h-fit p-4 lg:sticky lg:top-5">
            {!selected ? (
              <p className="text-[13px] text-ink-faint">یک گزارش را انتخاب کن</p>
            ) : (
              <div className="space-y-3 text-[13px]">
                <h2 className="text-[15px] font-semibold leading-snug">
                  {selected.listing.title}
                </h2>
                <p className="text-ink-muted">
                  {REPORT_REASON_LABELS[selected.reason]} ·{" "}
                  {faAdminDate(selected.createdAt)}
                </p>
                {selected.note ? (
                  <p className="rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/[0.05]">
                    {selected.note}
                  </p>
                ) : null}
                <div>
                  <p className="text-[11px] text-ink-faint">فروشنده</p>
                  <Link
                    href={`/admin/users/${selected.listing.seller.id}`}
                    className="text-brand-700 hover:underline"
                  >
                    {selected.listing.seller.name || "بدون نام"}
                  </Link>
                  <p className="font-mono text-[11px]" dir="ltr">
                    {selected.listing.seller.phone}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">گزارش‌دهنده</p>
                  <Link
                    href={`/admin/users/${selected.reporter.id}`}
                    className="text-brand-700 hover:underline"
                  >
                    {selected.reporter.name || "بدون نام"}
                  </Link>
                  <p className="font-mono text-[11px]" dir="ltr">
                    {selected.reporter.phone}
                  </p>
                </div>
                {selected.listing.dealStatus === "inactive" ? (
                  <p className="text-[12px] text-ink-muted">
                    این آگهی الان مخفی است.
                  </p>
                ) : null}

                {canWrite && selected.status === "open" ? (
                  <div className="space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <span>مخفی کردن آگهی</span>
                      <AdminSwitch
                        checked={hideListing}
                        label="مخفی کردن آگهی"
                        onChange={setHideListing}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>پیام سیستمی به گزارش‌دهنده</span>
                      <AdminSwitch
                        checked={noticeToReporter}
                        label="پیام سیستمی به گزارش‌دهنده"
                        onChange={setNoticeToReporter}
                      />
                    </div>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="دلیل برای لاگ (اختیاری)"
                      className="admin-input"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void resolve("reviewed")}
                        className="admin-btn flex-1 rounded-xl bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {saving ? "…" : "بررسی شد"}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void resolve("dismissed")}
                        className="admin-btn flex-1 rounded-xl border border-black/10 py-2 disabled:opacity-60 dark:border-white/15"
                      >
                        رد شد
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
