"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  FEEDBACK_KIND_LABELS,
  FEEDBACK_STATUS_LABELS,
  type FeedbackKind,
} from "@/lib/feedback";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import {
  AdminSkeleton,
  faAdminDate,
  AdminCount,
  AdminTabs,
  AdminLoadMore,
  AdminPill,
  mergeById,
} from "@/components/admin/AdminBits";

type FeedbackItem = {
  id: string;
  kind: FeedbackKind;
  body: string;
  path: string | null;
  status: "open" | "reviewed" | "closed";
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; phone: string };
};

type Me = { admin: { role: string } };

const PAGE_SIZE = 50;

export default function AdminFeedbackPage() {
  const { show } = useToast();
  const [status, setStatus] = useState<"open" | "reviewed" | "closed" | "all">(
    "open",
  );
  const [kind, setKind] = useState<"all" | FeedbackKind>("all");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status,
        limit: String(PAGE_SIZE),
        skip: "0",
      });
      if (kind !== "all") params.set("kind", kind);
      const data = await api<{ items: FeedbackItem[]; meta: { total: number } }>(
        `/api/admin/feedback?${params}`,
      );
      setItems(data.items);
      setTotal(data.meta.total);
      setSelected((cur) =>
        cur
          ? data.items.find((r) => r.id === cur.id) ?? data.items[0] ?? null
          : data.items[0] ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خواندن پیام‌ها نشد");
    } finally {
      setLoading(false);
    }
  }, [status, kind]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<Me>("/api/admin/auth/me")
      .then((d) => {
        setCanWrite(
          d.admin.role === "support" ||
            d.admin.role === "moderator" ||
            d.admin.role === "superadmin",
        );
      })
      .catch(() => setCanWrite(false));
  }, []);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status,
        limit: String(PAGE_SIZE),
        skip: String(items.length),
      });
      if (kind !== "all") params.set("kind", kind);
      const data = await api<{ items: FeedbackItem[]; meta: { total: number } }>(
        `/api/admin/feedback?${params}`,
      );
      setItems((cur) => mergeById(cur, data.items));
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه فهرست خوانده نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  async function setItemStatus(next: "open" | "reviewed" | "closed") {
    if (!selected || !canWrite) return;
    setSaving(true);
    try {
      await api(`/api/admin/feedback/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      show(
        next === "open"
          ? "باز شد"
          : next === "reviewed"
            ? "بررسی شد"
            : "بسته شد",
      );
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
          <h1 className="text-[20px] font-semibold">صندوق پیام اعضا</h1>
          <AdminCount loading={loading}>
            {toPersianDigits(total)} مورد در این فیلتر
          </AdminCount>
          <p className="mt-1 text-[12px] text-ink-faint">
            پیام‌های «پیام به سیرکل» — مشکل، پیشنهاد، یا تماس مستقیم اعضا
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AdminTabs
            label="وضعیت"
            value={status}
            onChange={setStatus}
            items={
              [
                { key: "open", label: FEEDBACK_STATUS_LABELS.open },
                { key: "reviewed", label: FEEDBACK_STATUS_LABELS.reviewed },
                { key: "closed", label: FEEDBACK_STATUS_LABELS.closed },
                { key: "all", label: "همه" },
              ] as const
            }
          />
          <AdminTabs
            label="نوع"
            value={kind}
            onChange={setKind}
            items={
              [
                { key: "all", label: "همه نوع" },
                { key: "issue", label: FEEDBACK_KIND_LABELS.issue },
                { key: "suggestion", label: FEEDBACK_KIND_LABELS.suggestion },
                { key: "contact", label: FEEDBACK_KIND_LABELS.contact },
              ] as const
            }
          />
        </div>
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
                  <th>پیام</th>
                  <th>نوع</th>
                  <th>فرستنده</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const active = selected?.id === row.id;
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
                        <p className="line-clamp-2 font-medium">{row.body}</p>
                        <p className="text-[11px] text-ink-faint nums">
                          {faAdminDate(row.createdAt)}
                        </p>
                      </td>
                      <td>{FEEDBACK_KIND_LABELS[row.kind]}</td>
                      <td>{row.user.name || "بدون نام"}</td>
                      <td>
                        <AdminPill
                          tone={
                            row.status === "open"
                              ? "warn"
                              : row.status === "reviewed"
                                ? "ok"
                                : "muted"
                          }
                        >
                          {FEEDBACK_STATUS_LABELS[row.status]}
                        </AdminPill>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-faint">
                      پیامی در این فیلتر نیست
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
              inset
            />
          </div>

          <aside className="admin-panel h-fit p-4 lg:sticky lg:top-5">
            {!selected ? (
              <p className="text-[13px] text-ink-faint">یک پیام را انتخاب کن</p>
            ) : (
              <div className="space-y-3 text-[13px]">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminPill>{FEEDBACK_KIND_LABELS[selected.kind]}</AdminPill>
                  <AdminPill
                    tone={
                      selected.status === "open"
                        ? "warn"
                        : selected.status === "reviewed"
                          ? "ok"
                          : "muted"
                    }
                  >
                    {FEEDBACK_STATUS_LABELS[selected.status]}
                  </AdminPill>
                </div>
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink dark:text-zinc-100">
                  {selected.body}
                </p>
                {selected.path ? (
                  <p
                    className="text-left text-[11px] text-ink-faint nums"
                    dir="ltr"
                  >
                    {selected.path}
                  </p>
                ) : null}

                <div>
                  <p className="text-[11px] text-ink-faint">فرستنده</p>
                  <Link
                    href={`/admin/users/${selected.user.id}`}
                    className="text-brand-700 hover:underline"
                  >
                    {selected.user.name || "بدون نام"}
                  </Link>
                  <p className="font-mono text-[11px]" dir="ltr">
                    {selected.user.phone}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint nums">
                    {faAdminDate(selected.createdAt)}
                  </p>
                </div>

                {canWrite ? (
                  <div className="flex flex-wrap gap-2 border-t border-black/5 pt-3 dark:border-white/10">
                    {selected.status !== "reviewed" ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void setItemStatus("reviewed")}
                        className="admin-btn rounded-xl bg-brand-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-40"
                      >
                        بررسی شد
                      </button>
                    ) : null}
                    {selected.status !== "closed" ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void setItemStatus("closed")}
                        className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[13px] disabled:opacity-40 dark:border-white/15"
                      >
                        بستن
                      </button>
                    ) : null}
                    {selected.status !== "open" ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void setItemStatus("open")}
                        className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[13px] disabled:opacity-40 dark:border-white/15"
                      >
                        باز کردن دوباره
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-muted">
                    فقط پشتیبانی و بالاتر می‌توانند وضعیت را عوض کنند.
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
