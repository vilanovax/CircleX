"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/persian";
import { AdminSkeleton, AdminPill, AdminCount, AdminLoadMore, downloadAdminCsv, mergeById } from "@/components/admin/AdminBits";
import { useToast } from "@/components/Toast";

type UserRow = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  profileCompleted: boolean;
  createdAt: string;
  circleCount: number;
  listingCount: number;
  inviteCount: number;
  banned: boolean;
};

const PAGE_SIZE = 40;

function UsersBody() {
  const { show } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const incomplete = searchParams.get("profile") === "incomplete";
  const banned = searchParams.get("banned") === "1";
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState(q);
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 280);
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
      if (debounced.trim()) params.set("q", debounced.trim());
      if (incomplete) params.set("profile", "incomplete");
      if (banned) params.set("banned", "1");
      const data = await api<{ items: UserRow[]; meta: { total: number } }>(
        `/api/admin/users?${params.toString()}`,
      );
      setItems(data.items);
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "جستجو نشد");
    } finally {
      setLoading(false);
    }
  }, [debounced, incomplete, banned]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: String(items.length),
      });
      if (debounced.trim()) params.set("q", debounced.trim());
      if (incomplete) params.set("profile", "incomplete");
      if (banned) params.set("banned", "1");
      const data = await api<{ items: UserRow[]; meta: { total: number } }>(
        `/api/admin/users?${params.toString()}`,
      );
      setItems((cur) => mergeById(cur, data.items));
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه فهرست خوانده نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">کاربران</h1>
          <AdminCount loading={loading}>
            {incomplete ? "فقط پروفایل ناقص · " : ""}
            {banned ? "فقط حساب‌های مسدود · " : ""}
            {toPersianDigits(total)} نفر
          </AdminCount>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="sr-only" htmlFor="admin-user-q">
          جستجوی کاربر
        </label>
        <input
          id="admin-user-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="نام، شماره، یا شناسه"
          className="admin-input"
        />
        {incomplete || banned ? (
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[12.5px] dark:border-white/15"
          >
            نمایش همه
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/admin/users?banned=1")}
            className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[12.5px] dark:border-white/15"
          >
            مسدودها
          </button>
        )}
        <button
          type="button"
          disabled={exporting}
          onClick={() => {
            setExporting(true);
            void downloadAdminCsv("users")
              .then(() => show("فایل CSV آماده شد"))
              .catch((err) =>
                show(err instanceof Error ? err.message : "خروجی گرفته نشد"),
              )
              .finally(() => setExporting(false));
          }}
          className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[12.5px] disabled:opacity-50 dark:border-white/15"
        >
          {exporting ? "در حال ساخت…" : "خروجی CSV"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-red-600">
          {error}
        </p>
      ) : null}
      {loading && !items.length ? (
        <AdminSkeleton />
      ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>نام</th>
                <th>شماره</th>
                <th>شهر</th>
                <th>حلقه</th>
                <th>آگهی</th>
                <th className="hidden xl:table-cell">دعوت</th>
                <th>پروفایل</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/users/${row.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/admin/users/${row.id}`);
                    }
                  }}
                  tabIndex={0}
                >
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/admin/users/${row.id}`}
                        className="font-medium text-brand-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.name || "بدون نام"}
                      </Link>
                      {row.banned ? (
                        <AdminPill tone="warn">مسدود</AdminPill>
                      ) : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-mono text-[12px]" dir="ltr">
                    {row.phone}
                  </td>
                  <td>{row.city || "—"}</td>
                  <td>{toPersianDigits(row.circleCount)}</td>
                  <td>{toPersianDigits(row.listingCount)}</td>
                  <td className="hidden xl:table-cell">
                    {toPersianDigits(row.inviteCount)}
                  </td>
                  <td>
                    {row.profileCompleted ? (
                      <AdminPill tone="ok">کامل</AdminPill>
                    ) : (
                      <AdminPill tone="warn">ناقص</AdminPill>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink-faint">
                    {q.trim() || incomplete || banned
                      ? "کسی با این فیلتر پیدا نشد"
                      : "هنوز کاربری نیست"}
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
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <UsersBody />
    </Suspense>
  );
}
