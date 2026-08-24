"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
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

type WatchItem = {
  id: string;
  kind: string;
  phrase: string | null;
  enabled: boolean;
  adminLocked: boolean;
  hitCount: number;
  createdAt: string;
  owner: { id: string; name: string; phone: string };
  target: { id: string; name: string; phone: string } | null;
};

type Me = { admin: { role: string } };

const PAGE_SIZE = 50;

export default function AdminWatchesPage() {
  const { show } = useToast();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [kind, setKind] = useState<"all" | "phrase" | "person">("all");
  const [filter, setFilter] = useState<"all" | "on" | "off" | "locked">("all");
  const [items, setItems] = useState<WatchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<WatchItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: "0",
      });
      if (debounced) params.set("q", debounced);
      if (kind !== "all") params.set("kind", kind);
      if (filter === "on") params.set("enabled", "1");
      if (filter === "off") params.set("enabled", "0");
      if (filter === "locked") params.set("locked", "1");
      const data = await api<{ items: WatchItem[]; meta: { total: number } }>(
        `/api/admin/watches?${params}`,
      );
      setItems(data.items);
      setTotal(data.meta.total);
      setSelected((cur) =>
        cur
          ? data.items.find((r) => r.id === cur.id) ?? data.items[0] ?? null
          : data.items[0] ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خواندن گوش‌به‌زنگ نشد");
    } finally {
      setLoading(false);
    }
  }, [debounced, kind, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: String(items.length),
      });
      if (debounced) params.set("q", debounced);
      if (kind !== "all") params.set("kind", kind);
      if (filter === "on") params.set("enabled", "1");
      if (filter === "off") params.set("enabled", "0");
      if (filter === "locked") params.set("locked", "1");
      const data = await api<{ items: WatchItem[]; meta: { total: number } }>(
        `/api/admin/watches?${params}`,
      );
      setItems((cur) => mergeById(cur, data.items));
      setTotal(data.meta.total);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ادامه فهرست نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    api<Me>("/api/admin/auth/me")
      .then((d) =>
        setCanWrite(d.admin.role === "moderator" || d.admin.role === "superadmin"),
      )
      .catch(() => setCanWrite(false));
  }, []);

  useEffect(() => {
    setReason("");
  }, [selected?.id]);

  async function setEnabled(next: boolean) {
    if (!selected || saving) return;
    setSaving(true);
    try {
      const data = await api<{ enabled: boolean; adminLocked: boolean }>(
        `/api/admin/watches/${encodeURIComponent(selected.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ enabled: next, reason }),
        },
      );
      show(next ? "گوش‌به‌زنگ روشن شد" : "گوش‌به‌زنگ خاموش شد");
      setItems((cur) =>
        cur.map((row) =>
          row.id === selected.id
            ? { ...row, enabled: data.enabled, adminLocked: data.adminLocked }
            : row,
        ),
      );
      setSelected((cur) =>
        cur && cur.id === selected.id
          ? { ...cur, enabled: data.enabled, adminLocked: data.adminLocked }
          : cur,
      );
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
          <h1 className="text-[20px] font-semibold">گوش‌به‌زنگ</h1>
          <AdminCount loading={loading}>
            {toPersianDigits(total)} مورد در این فیلتر
          </AdminCount>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AdminTabs
            label="نوع گوش‌به‌زنگ"
            value={kind}
            onChange={setKind}
            items={
              [
                { key: "all", label: "همه" },
                { key: "phrase", label: "عبارت" },
                { key: "person", label: "شخص" },
              ] as const
            }
          />
          <AdminTabs
            label="وضعیت گوش‌به‌زنگ"
            value={filter}
            onChange={setFilter}
            items={
              [
                { key: "all", label: "همه" },
                { key: "on", label: "روشن" },
                { key: "off", label: "خاموش" },
                { key: "locked", label: "قفل تیم" },
              ] as const
            }
          />
        </div>
      </div>

      <label className="mb-3 block">
        <span className="sr-only">جستجو</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="عبارت، نام مالک، یا شماره"
          className="admin-input max-w-md"
        />
      </label>

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
                  <th>گوش‌به‌زنگ</th>
                  <th>مالک</th>
                  <th>اصابت</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const active = selected?.id === row.id;
                  const label =
                    row.kind === "person"
                      ? row.target?.name || "شخص"
                      : row.phrase || "عبارت";
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
                        <p className="font-medium">{label}</p>
                        <p className="text-[11px] text-ink-faint">
                          {row.kind === "person" ? "شخص" : "عبارت"}
                        </p>
                      </td>
                      <td>{row.owner.name || "بدون نام"}</td>
                      <td className="tabular-nums">
                        {toPersianDigits(row.hitCount)}
                      </td>
                      <td>
                        {row.adminLocked ? (
                          <AdminPill tone="warn">قفل تیم</AdminPill>
                        ) : row.enabled ? (
                          <AdminPill tone="ok">روشن</AdminPill>
                        ) : (
                          <AdminPill>خاموش</AdminPill>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-ink-faint">
                      گوش‌به‌زنگی در این فیلتر نیست
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
              <p className="text-[13px] text-ink-faint">یک مورد را انتخاب کن</p>
            ) : (
              <div className="space-y-3 text-[13px]">
                <h2 className="text-[15px] font-semibold leading-snug">
                  {selected.kind === "person"
                    ? selected.target?.name || "شخص"
                    : selected.phrase || "عبارت"}
                </h2>
                <p className="text-ink-muted">
                  {selected.kind === "person" ? "شخص حلقه" : "عبارت"} ·{" "}
                  {faAdminDate(selected.createdAt)}
                </p>
                <p className="text-[12px] text-ink-muted">
                  اصابت: {toPersianDigits(selected.hitCount)}
                </p>
                <div>
                  <p className="text-[11px] text-ink-faint">مالک</p>
                  <Link
                    href={`/admin/users/${selected.owner.id}`}
                    className="text-brand-700 hover:underline"
                  >
                    {selected.owner.name || "بدون نام"}
                  </Link>
                  <p className="font-mono text-[11px]" dir="ltr">
                    {selected.owner.phone}
                  </p>
                </div>
                {selected.target ? (
                  <div>
                    <p className="text-[11px] text-ink-faint">شخص هدف</p>
                    <Link
                      href={`/admin/users/${selected.target.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {selected.target.name || "بدون نام"}
                    </Link>
                    <p className="font-mono text-[11px]" dir="ltr">
                      {selected.target.phone}
                    </p>
                  </div>
                ) : null}
                {selected.adminLocked ? (
                  <p className="text-[12px] text-ink-muted">
                    مالک نمی‌تواند دوباره روشن کند مگر وقتی تیم قفل را بردارد.
                  </p>
                ) : null}

                {canWrite ? (
                  <div className="space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="دلیل برای لاگ (اختیاری)"
                      className="admin-input"
                      rows={2}
                    />
                    {selected.enabled ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void setEnabled(false)}
                        className="admin-btn w-full rounded-xl bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {saving ? "…" : "خاموش و قفل"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void setEnabled(true)}
                        className="admin-btn w-full rounded-xl border border-black/10 py-2 disabled:opacity-60 dark:border-white/15"
                      >
                        {saving ? "…" : "روشن کردن"}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-faint">
                    این نقش فقط می‌تواند ببیند.
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
