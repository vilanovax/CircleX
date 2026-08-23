"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  ADMIN_ROLE_LABELS,
  AUDIT_ACTION_LABELS,
  AUDIT_TARGET_LABELS,
  auditMetaRows,
  auditTargetHref,
  type AuditGroup,
} from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import {
  AdminCount,
  AdminLoadMore,
  AdminSkeleton,
  AdminTabs,
  faAdminDate,
  mergeById,
} from "@/components/admin/AdminBits";

type AuditActor = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuditItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  meta: unknown;
  createdAt: string;
  actor: AuditActor;
};

const PAGE_SIZE = 50;

const GROUPS = [
  { key: "all", label: "همه" },
  { key: "users", label: "کاربر" },
  { key: "content", label: "محتوا" },
  { key: "invites", label: "دعوت" },
  { key: "ops", label: "عملیات" },
] as const;

function shortId(id: string): string {
  return id.length > 8 ? id.slice(-8) : id;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

function displayMetaValue(value: string): string {
  if (isIsoDate(value)) return faAdminDate(value);
  if (/^-?\d+(\.\d+)?$/.test(value)) return toPersianDigits(value);
  return value;
}

function targetTitle(row: AuditItem): string {
  return row.targetLabel ?? "حذف‌شده";
}

export default function AdminAuditPage() {
  const [group, setGroup] = useState<AuditGroup>("all");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const data = await api<{
        items: AuditItem[];
        meta: { total: number };
      }>(`/api/admin/audit?group=${group}&limit=${PAGE_SIZE}&skip=0`);
      setItems(data.items);
      setTotal(data.meta.total);
      setSelected((cur) =>
        cur
          ? data.items.find((row) => row.id === cur.id) ?? data.items[0] ?? null
          : data.items[0] ?? null,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        setItems([]);
        setTotal(0);
        setSelected(null);
      } else {
        setError(err instanceof ApiError ? err.message : "خواندن لاگ نشد");
      }
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await api<{
        items: AuditItem[];
        meta: { total: number };
      }>(
        `/api/admin/audit?group=${group}&limit=${PAGE_SIZE}&skip=${items.length}`,
      );
      setItems((cur) => mergeById(cur, data.items));
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه فهرست خوانده نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  const href = selected
    ? auditTargetHref(selected.targetType, selected.targetId)
    : null;
  const metaRows = selected ? auditMetaRows(selected.meta) : [];

  if (forbidden) {
    return (
      <div>
        <div className="admin-page-head">
          <div>
            <h1 className="text-[20px] font-semibold">لاگ عملیات</h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              این بخش برای ناظر و مدیر کل است. دلیل مسدود و جزئیات اپراتور اینجا
              دیده می‌شود.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">لاگ عملیات</h1>
          <AdminCount loading={loading}>
            {toPersianDigits(total)} عمل در این فیلتر
          </AdminCount>
        </div>
        <AdminTabs
          label="بخش لاگ"
          value={group}
          onChange={setGroup}
          items={GROUPS}
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
                  <th>زمان</th>
                  <th>عمل</th>
                  <th>هدف</th>
                  <th>اپراتور</th>
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
                      className="cursor-pointer"
                    >
                      <td className="whitespace-nowrap text-ink-faint">
                        {faAdminDate(row.createdAt)}
                      </td>
                      <td>
                        <p className="font-medium">
                          {AUDIT_ACTION_LABELS[row.action] ?? row.action}
                        </p>
                      </td>
                      <td>
                        <p className="font-medium">{targetTitle(row)}</p>
                        <p className="text-[11px] text-ink-faint">
                          {AUDIT_TARGET_LABELS[row.targetType] ?? row.targetType}
                          {!row.targetLabel ? (
                            <>
                              {" "}
                              ·{" "}
                              <span dir="ltr">{shortId(row.targetId)}</span>
                            </>
                          ) : null}
                        </p>
                      </td>
                      <td>
                        <p>{row.actor.name || "—"}</p>
                        <p className="text-[11px] text-ink-faint">
                          {ADMIN_ROLE_LABELS[row.actor.role] ?? row.actor.role}
                        </p>
                      </td>
                    </tr>
                  );
                })}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-ink-faint">
                      {group === "all"
                        ? "هنوز عملی ثبت نشده — مسدود، مخفی، لغو دعوت و تنظیمات اینجا می‌آیند"
                        : "در این بخش عملی نیست"}
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
              <p className="text-[13px] text-ink-faint">یک عمل را انتخاب کن</p>
            ) : (
              <div className="space-y-3 text-[13px]">
                <h2 className="text-[15px] font-semibold leading-snug">
                  {AUDIT_ACTION_LABELS[selected.action] ?? selected.action}
                </h2>
                <p className="text-ink-muted">
                  {faAdminDate(selected.createdAt)}
                </p>
                <div>
                  <p className="text-[11px] text-ink-faint">هدف</p>
                  {href ? (
                    <Link
                      href={href}
                      className="text-brand-700 hover:underline"
                    >
                      {targetTitle(selected)}
                    </Link>
                  ) : (
                    <p>{targetTitle(selected)}</p>
                  )}
                  <p className="text-[11px] text-ink-faint">
                    {AUDIT_TARGET_LABELS[selected.targetType] ??
                      selected.targetType}
                    {!selected.targetLabel ? (
                      <>
                        {" "}
                        · <span dir="ltr">{shortId(selected.targetId)}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-ink-faint">اپراتور</p>
                  <p>{selected.actor.name || "—"}</p>
                  <p className="text-[11px] text-ink-faint">
                    {ADMIN_ROLE_LABELS[selected.actor.role] ??
                      selected.actor.role}
                  </p>
                  {selected.actor.email ? (
                    <p className="font-mono text-[11px]" dir="ltr">
                      {selected.actor.email}
                    </p>
                  ) : null}
                </div>
                {selected.reason ? (
                  <div>
                    <p className="text-[11px] text-ink-faint">دلیل</p>
                    <p className="rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/[0.05]">
                      {selected.reason}
                    </p>
                  </div>
                ) : null}
                {metaRows.length ? (
                  <dl className="space-y-1.5 border-t border-black/5 pt-3 dark:border-white/10">
                    {metaRows.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-start justify-between gap-3"
                      >
                        <dt className="text-[11px] text-ink-faint">
                          {row.label}
                        </dt>
                        <dd className="text-end">{displayMetaValue(row.value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
