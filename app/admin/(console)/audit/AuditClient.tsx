"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { copyText } from "@/lib/invite";
import {
  ADMIN_ROLE_LABELS,
  AUDIT_ACTION_LABELS,
  AUDIT_TARGET_LABELS,
  auditMetaRows,
  auditTargetHref,
  type AuditGroup,
} from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import { SearchIcon } from "@/components/Icons";
import { useToast } from "@/components/Toast";
import {
  AdminCount,
  AdminLoadMore,
  AdminPill,
  AdminSkeleton,
  faAdminDate,
  faAdminRelative,
  mergeById,
} from "@/components/admin/AdminBits";
import {
  ADMIN_AUDIT_PAGE_SIZE,
  type AdminAuditRow,
} from "@/lib/admin-audit-list";

const GROUPS = [
  { key: "all", label: "همه" },
  { key: "users", label: "کاربر" },
  { key: "content", label: "محتوا" },
  { key: "invites", label: "دعوت" },
  { key: "ops", label: "عملیات" },
] as const;

type Props = {
  group: AuditGroup;
  initialQ: string;
  initialItems: AdminAuditRow[];
  initialTotal: number;
};

function auditHref(group: AuditGroup, search: string): string {
  const params = new URLSearchParams();
  if (group !== "all") params.set("group", group);
  const q = search.trim();
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

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

function targetTitle(row: AdminAuditRow): string {
  return row.targetLabel ?? "حذف‌شده";
}

function actionTone(action: string): "warn" | "ok" | "muted" {
  if (
    action === "user.ban" ||
    action === "watch.disable" ||
    action === "invite.revoke" ||
    action.endsWith(".moderate")
  ) {
    return "warn";
  }
  if (
    action === "user.unban" ||
    action === "watch.enable" ||
    action === "invite.extend"
  ) {
    return "ok";
  }
  return "muted";
}

function actionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function AuditClient({
  group,
  initialQ,
  initialItems,
  initialTotal,
}: Props) {
  const { show } = useToast();
  const router = useRouter();
  const skipFirst = useRef(true);
  const [q, setQ] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [items, setItems] = useState<AdminAuditRow[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [selected, setSelected] = useState<AdminAuditRow | null>(
    initialItems[0] ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (debounced.trim() === initialQ.trim()) return;
    router.replace(auditHref(group, debounced), { scroll: false });
  }, [debounced, group, initialQ, router]);

  const query = useCallback(
    (skip: number) => {
      const params = new URLSearchParams({
        group,
        limit: String(ADMIN_AUDIT_PAGE_SIZE),
        skip: String(skip),
      });
      if (debounced.trim()) params.set("q", debounced.trim());
      return `/api/admin/audit?${params.toString()}`;
    },
    [group, debounced],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{
        items: AdminAuditRow[];
        meta: { total: number };
      }>(query(0));
      setItems(data.items);
      setTotal(data.meta.total);
      setSelected((cur) =>
        cur
          ? data.items.find((row) => row.id === cur.id) ?? data.items[0] ?? null
          : data.items[0] ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خواندن لاگ نشد");
    } finally {
      setLoading(false);
    }
  }, [query]);

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
      const data = await api<{
        items: AdminAuditRow[];
        meta: { total: number };
      }>(query(items.length));
      setItems((cur) => mergeById(cur, data.items));
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه فهرست خوانده نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  function moveSelection(delta: number) {
    if (!items.length) return;
    const i = selected ? items.findIndex((row) => row.id === selected.id) : 0;
    const next = items[Math.min(items.length - 1, Math.max(0, i + delta))];
    if (next) setSelected(next);
  }

  async function copy(value: string, ok: string) {
    const done = await copyText(value);
    show(done ? ok : "کپی نشد");
  }

  const href = selected
    ? auditTargetHref(selected.targetType, selected.targetId)
    : null;
  const metaRows = selected ? auditMetaRows(selected.meta) : [];
  const subtitle = useMemo(() => {
    const n = toPersianDigits(total);
    if (debounced.trim()) {
      return loading
        ? "در حال خواندن…"
        : `${n} نتیجه برای «${debounced.trim()}»`;
    }
    return `${n} عمل در این بخش`;
  }, [total, debounced, loading]);

  return (
    <div>
      <div className="admin-page-head">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold">لاگ عملیات</h1>
          <AdminCount loading={loading && !debounced.trim()}>
            {subtitle}
          </AdminCount>
        </div>
      </div>

      <div className="admin-toolbar">
        <label className="sr-only" htmlFor="admin-audit-q">
          جستجوی لاگ
        </label>
        <div className="relative min-w-0 flex-1 basis-[14rem] max-w-[28rem]">
          <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="admin-audit-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && q) setQ("");
            }}
            placeholder="عمل، اپراتور، ایمیل، شناسه، دلیل"
            className="admin-input w-full pr-9"
          />
        </div>
        <div
          className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]"
          role="tablist"
          aria-label="بخش لاگ"
        >
          {GROUPS.map((tab) => {
            const active = group === tab.key;
            return (
              <Link
                key={tab.key}
                href={auditHref(tab.key, q)}
                prefetch
                role="tab"
                aria-selected={active}
                className={`admin-btn shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] ${
                  active
                    ? "bg-[var(--circle-surface)] font-medium shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
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
                  <th>زمان</th>
                  <th>عمل</th>
                  <th>هدف</th>
                  <th>اپراتور</th>
                </tr>
              </thead>
              <tbody
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    moveSelection(1);
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    moveSelection(-1);
                  }
                }}
              >
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
                      <td className="whitespace-nowrap">
                        <p className="text-[13px]">{faAdminRelative(row.createdAt)}</p>
                        <p className="text-[11px] text-ink-faint">
                          {faAdminDate(row.createdAt)}
                        </p>
                      </td>
                      <td>
                        <AdminPill tone={actionTone(row.action)}>
                          {actionLabel(row.action)}
                        </AdminPill>
                      </td>
                      <td>
                        <p className="font-medium">{targetTitle(row)}</p>
                        <p className="text-[11px] text-ink-faint">
                          {AUDIT_TARGET_LABELS[row.targetType] ?? row.targetType}
                          {!row.targetLabel ? (
                            <>
                              {" "}
                              · <span dir="ltr">{shortId(row.targetId)}</span>
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
                      {debounced.trim()
                        ? "با این جستجو عملی پیدا نشد"
                        : group === "all"
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

          <aside className="admin-panel h-fit overflow-hidden lg:sticky lg:top-5">
            {!selected ? (
              <p className="p-4 text-[13px] text-ink-faint">یک عمل را انتخاب کن</p>
            ) : (
              <div>
                <div className="border-b border-black/5 px-4 py-3.5 dark:border-white/10">
                  <AdminPill tone={actionTone(selected.action)}>
                    {actionLabel(selected.action)}
                  </AdminPill>
                  <p className="mt-2 text-[12.5px] text-ink-muted">
                    {faAdminRelative(selected.createdAt)}
                    {" · "}
                    {faAdminDate(selected.createdAt)}
                  </p>
                  {href ? (
                    <Link
                      href={href}
                      className="mt-3 inline-flex admin-btn rounded-xl bg-brand-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand-700"
                    >
                      باز کردن هدف
                    </Link>
                  ) : null}
                </div>

                <dl className="space-y-3 px-4 py-3.5 text-[13px]">
                  <div>
                    <dt className="text-[11px] text-ink-faint">هدف</dt>
                    <dd className="mt-0.5 font-medium">{targetTitle(selected)}</dd>
                    <dd className="text-[12px] text-ink-muted">
                      {AUDIT_TARGET_LABELS[selected.targetType] ??
                        selected.targetType}
                    </dd>
                    <dd className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-faint" dir="ltr">
                        {shortId(selected.targetId)}
                      </span>
                      <button
                        type="button"
                        className="admin-btn text-[12px] text-brand-700"
                        onClick={() => void copy(selected.targetId, "شناسه کپی شد")}
                      >
                        کپی شناسه
                      </button>
                    </dd>
                  </div>
                  <div className="border-t border-black/5 pt-3 dark:border-white/10">
                    <dt className="text-[11px] text-ink-faint">اپراتور</dt>
                    <dd className="mt-0.5">{selected.actor.name || "—"}</dd>
                    <dd className="text-[12px] text-ink-muted">
                      {ADMIN_ROLE_LABELS[selected.actor.role] ??
                        selected.actor.role}
                    </dd>
                    {selected.actor.email ? (
                      <dd className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px]" dir="ltr">
                          {selected.actor.email}
                        </span>
                        <button
                          type="button"
                          className="admin-btn text-[12px] text-brand-700"
                          onClick={() =>
                            void copy(selected.actor.email, "ایمیل کپی شد")
                          }
                        >
                          کپی
                        </button>
                      </dd>
                    ) : null}
                  </div>
                  {selected.reason ? (
                    <div className="border-t border-black/5 pt-3 dark:border-white/10">
                      <dt className="text-[11px] text-ink-faint">دلیل</dt>
                      <dd className="mt-1 rounded-xl bg-black/[0.03] p-2.5 leading-relaxed dark:bg-white/[0.05]">
                        {selected.reason}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {metaRows.length ? (
                  <div className="border-t border-black/5 px-4 py-3.5 dark:border-white/10">
                    <p className="mb-2 text-[11px] text-ink-faint">تغییرات</p>
                    <dl className="space-y-2">
                      {metaRows.map((row) => (
                        <div
                          key={row.key}
                          className="flex items-start justify-between gap-3 text-[13px]"
                        >
                          <dt className="text-ink-muted">{row.label}</dt>
                          <dd className="text-end font-medium">
                            {displayMetaValue(row.value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <p className="border-t border-black/5 px-4 py-3 text-[12px] text-ink-faint dark:border-white/10">
                    جزئیات بیشتری در متا نیست
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
