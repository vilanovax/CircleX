"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/persian";
import { SearchIcon } from "@/components/Icons";
import {
  AdminCount,
  AdminLoadMore,
  AdminPill,
  AdminSkeleton,
  downloadAdminCsv,
  faAdminDate,
  mergeById,
} from "@/components/admin/AdminBits";
import { useToast } from "@/components/Toast";
import {
  ADMIN_USERS_PAGE_SIZE,
  type AdminUserRow,
} from "@/lib/admin-users";

type FilterKey = "all" | "banned" | "incomplete";

type Props = {
  initialItems: AdminUserRow[];
  initialTotal: number;
  initialQ: string;
  incomplete: boolean;
  banned: boolean;
};

function usersHref(filter: FilterKey, search: string): string {
  const params = new URLSearchParams();
  const q = search.trim();
  if (q) params.set("q", q);
  if (filter === "banned") params.set("banned", "1");
  if (filter === "incomplete") params.set("profile", "incomplete");
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

function nameInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1) : "؟";
}

function CountCell({ value }: { value: number }) {
  return (
    <span className={value === 0 ? "tabular-nums text-ink-faint" : "tabular-nums"}>
      {toPersianDigits(value)}
    </span>
  );
}

export function UsersClient({
  initialItems,
  initialTotal,
  initialQ,
  incomplete,
  banned,
}: Props) {
  const { show } = useToast();
  const router = useRouter();
  const skipFirst = useRef(true);
  const filter: FilterKey = banned ? "banned" : incomplete ? "incomplete" : "all";
  const [q, setQ] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [items, setItems] = useState<AdminUserRow[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (debounced.trim() === initialQ.trim()) return;
    router.replace(usersHref(filter, debounced), { scroll: false });
  }, [debounced, filter, initialQ, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(ADMIN_USERS_PAGE_SIZE),
        skip: "0",
      });
      if (debounced.trim()) params.set("q", debounced.trim());
      if (incomplete) params.set("profile", "incomplete");
      if (banned) params.set("banned", "1");
      const data = await api<{ items: AdminUserRow[]; meta: { total: number } }>(
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
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(ADMIN_USERS_PAGE_SIZE),
        skip: String(items.length),
      });
      if (debounced.trim()) params.set("q", debounced.trim());
      if (incomplete) params.set("profile", "incomplete");
      if (banned) params.set("banned", "1");
      const data = await api<{ items: AdminUserRow[]; meta: { total: number } }>(
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

  const subtitle = useMemo(() => {
    if (filter === "banned") return `مسدود · ${toPersianDigits(total)} نفر`;
    if (filter === "incomplete") return `پروفایل ناقص · ${toPersianDigits(total)} نفر`;
    return `${toPersianDigits(total)} نفر`;
  }, [filter, total]);

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">کاربران</h1>
          <AdminCount loading={loading}>{subtitle}</AdminCount>
        </div>
      </div>
      <div className="admin-toolbar">
        <label className="sr-only" htmlFor="admin-user-q">
          جستجوی کاربر
        </label>
        <div className="relative min-w-0 flex-1 basis-[14rem] max-w-[28rem]">
          <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="admin-user-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && q) setQ("");
            }}
            placeholder="نام، شماره، یا شناسه"
            className="admin-input w-full pr-9"
          />
        </div>
        <div
          className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]"
          role="tablist"
          aria-label="فیلتر کاربران"
        >
          {(
            [
              { key: "all" as const, label: "همه" },
              { key: "banned" as const, label: "مسدود" },
              { key: "incomplete" as const, label: "پروفایل ناقص" },
            ] as const
          ).map((tab) => (
            <Link
              key={tab.key}
              href={usersHref(tab.key, q)}
              prefetch
              className={`admin-btn shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] ${
                filter === tab.key
                  ? "bg-[var(--circle-surface)] font-medium shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
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
        <p role="alert" className="mb-3 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}
      {loading && !items.length ? (
        <AdminSkeleton />
      ) : (
        <div className="admin-panel overflow-hidden">
          <div className="admin-table-wrap max-h-[min(72dvh,44rem)] [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-[2]">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>نام</th>
                  <th>شماره</th>
                  <th>شهر</th>
                  <th>عضویت</th>
                  <th>حلقه</th>
                  <th>آگهی</th>
                  <th className="hidden xl:table-cell">دعوت</th>
                  <th>پروفایل</th>
                  <th>
                    <span className="sr-only">پرونده</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[12.5px] font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                        >
                          {nameInitial(row.name)}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/users/${row.id}`}
                            prefetch
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {row.name || "بدون نام"}
                          </Link>
                          {row.banned ? (
                            <div className="mt-0.5">
                              <AdminPill tone="warn">مسدود</AdminPill>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap font-mono text-[12px]" dir="ltr">
                      {row.phone}
                    </td>
                    <td>{row.city || "—"}</td>
                    <td className="whitespace-nowrap text-[12px] text-ink-muted">
                      {faAdminDate(row.createdAt)}
                    </td>
                    <td>
                      <CountCell value={row.circleCount} />
                    </td>
                    <td>
                      <CountCell value={row.listingCount} />
                    </td>
                    <td className="hidden xl:table-cell">
                      <CountCell value={row.inviteCount} />
                    </td>
                    <td>
                      {row.profileCompleted ? (
                        <AdminPill tone="ok">کامل</AdminPill>
                      ) : (
                        <AdminPill tone="warn">ناقص</AdminPill>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/users/${row.id}`}
                        prefetch
                        className="admin-btn inline-flex rounded-lg border border-black/10 px-2.5 py-1 text-[12px] dark:border-white/15"
                      >
                        پرونده
                      </Link>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <p className="text-[14px] font-medium text-ink">
                        {q.trim() || filter !== "all"
                          ? "کسی با این فیلتر پیدا نشد"
                          : "هنوز کاربری نیست"}
                      </p>
                      {q.trim() || filter !== "all" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQ("");
                            router.push(usersHref("all", ""));
                          }}
                          className="mt-3 admin-btn rounded-xl border border-black/10 px-3 py-1.5 text-[12.5px] dark:border-white/15"
                        >
                          پاک کردن فیلتر
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {items.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 px-3 py-2.5 dark:border-white/10">
              <p className="text-[11px] text-ink-faint">
                نمایش {toPersianDigits(items.length)} از {toPersianDigits(total)}
              </p>
              <div className="min-w-[12rem] flex-1 sm:max-w-[18rem]">
                <AdminLoadMore
                  shown={items.length}
                  total={total}
                  loading={loadingMore}
                  onLoad={() => void loadMore()}
                  inset={false}
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
