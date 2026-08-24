"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import {
  ADMIN_ROLE_LABELS,
  AUDIT_ACTION_LABELS,
  CONTENT_KIND_LABELS,
} from "@/lib/admin-labels";
import { eventKindLabels, listingTypeLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import type { EventKind, ListingType } from "@/lib/types";
import { useToast } from "@/components/Toast";
import {
  AdminPill,
  AdminSkeleton,
  AdminCount,
  AdminTabs,
  AdminSwitch,
  AdminLoadMore,
  faAdminDate,
  mergeById,
} from "@/components/admin/AdminBits";

type Kind = "listing" | "request" | "event";
type Visibility = "all" | "visible" | "hidden";

type Owner = { id: string; name: string; phone: string };

type ContentItem = {
  id: string;
  title: string;
  hidden: boolean;
  city: string | null;
  hasImage: boolean;
  createdAt: string;
  owner: Owner;
  type?: string;
  category?: string;
  kind?: string;
  dateLabel?: string;
  dealStatus?: string | null;
};

type Me = { admin: { role: string } };

type FileAuditItem = {
  id: string;
  action: string;
  targetType: string;
  reason: string | null;
  createdAt: string;
  actor: { name: string; role: string };
};

const KINDS: Kind[] = ["listing", "request", "event"];
const PAGE_SIZE = 50;
const AUDIT_PAGE = 20;

function auditQuery(kind: Kind, id: string): string {
  if (kind === "listing") return `aboutListing=${encodeURIComponent(id)}`;
  if (kind === "request") {
    return `targetType=WantRequest&targetId=${encodeURIComponent(id)}`;
  }
  return `targetType=Gathering&targetId=${encodeURIComponent(id)}`;
}

function endpoint(kind: Kind): string {
  if (kind === "listing") return "/api/admin/listings";
  if (kind === "request") return "/api/admin/requests";
  return "/api/admin/events";
}

function ContentBody() {
  const searchParams = useSearchParams();
  const initialKind = searchParams.get("kind");
  const initialHidden = searchParams.get("hidden");
  const [kind, setKind] = useState<Kind>(
    initialKind === "request" || initialKind === "event" ? initialKind : "listing",
  );
  const [visibility, setVisibility] = useState<Visibility>(
    initialHidden === "1"
      ? "hidden"
      : initialHidden === "0"
        ? "visible"
        : "all",
  );
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [reason, setReason] = useState("");
  const [noticeToOwner, setNoticeToOwner] = useState(true);
  const [clearImage, setClearImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [audit, setAudit] = useState<FileAuditItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMore, setAuditMore] = useState(false);
  const [canSeeAudit, setCanSeeAudit] = useState(false);
  const [auditNonce, setAuditNonce] = useState(0);
  const { show } = useToast();

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 280);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    api<Me>("/api/admin/auth/me")
      .then((d) => {
        setCanWrite(
          d.admin.role === "moderator" || d.admin.role === "superadmin",
        );
      })
      .catch(() => setCanWrite(false));
  }, []);

  const filters = useMemo(() => {
    const params = new URLSearchParams();
    if (debounced.trim()) params.set("q", debounced.trim());
    if (visibility === "hidden") params.set("hidden", "1");
    if (visibility === "visible") params.set("hidden", "0");
    return params;
  }, [debounced, visibility]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
      params.set("limit", String(PAGE_SIZE));
      params.set("skip", "0");
      const data = await api<{ items: ContentItem[]; meta: { total: number } }>(
        `${endpoint(kind)}?${params.toString()}`,
      );
      setItems(data.items);
      setTotal(data.meta.total);
      setSelected((cur) =>
        cur
          ? data.items.find((row) => row.id === cur.id) ?? data.items[0] ?? null
          : data.items[0] ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خواندن محتوا نشد");
    } finally {
      setLoading(false);
    }
  }, [kind, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
      params.set("limit", String(PAGE_SIZE));
      params.set("skip", String(items.length));
      const data = await api<{ items: ContentItem[]; meta: { total: number } }>(
        `${endpoint(kind)}?${params.toString()}`,
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
    setReason("");
    setClearImage(false);
    setNoticeToOwner(true);
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) {
      setAudit([]);
      setAuditTotal(0);
      return;
    }
    const id = selected.id;
    let live = true;
    setAuditLoading(true);
    api<{ items: FileAuditItem[]; meta: { total: number } }>(
      `/api/admin/audit?${auditQuery(kind, id)}&limit=${AUDIT_PAGE}&skip=0`,
    )
      .then((logs) => {
        if (!live) return;
        setAudit(logs.items);
        setAuditTotal(logs.meta.total);
        setCanSeeAudit(true);
      })
      .catch((err) => {
        if (!live) return;
        if (err instanceof ApiError && err.status === 403) {
          setCanSeeAudit(false);
          setAudit([]);
          setAuditTotal(0);
        }
      })
      .finally(() => {
        if (live) setAuditLoading(false);
      });
    return () => {
      live = false;
    };
  }, [selected?.id, kind, auditNonce]);

  async function loadMoreAudit() {
    if (!selected || auditMore || audit.length >= auditTotal) return;
    setAuditMore(true);
    try {
      const logs = await api<{
        items: FileAuditItem[];
        meta: { total: number };
      }>(
        `/api/admin/audit?${auditQuery(kind, selected.id)}&limit=${AUDIT_PAGE}&skip=${audit.length}`,
      );
      setAudit((cur) => mergeById(cur, logs.items));
      setAuditTotal(logs.meta.total);
    } finally {
      setAuditMore(false);
    }
  }

  async function moderate(hidden: boolean) {
    if (!selected) return;
    setSaving(true);
    try {
      await api(`${endpoint(kind)}/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hidden,
          noticeToOwner: hidden ? noticeToOwner : false,
          reason,
          ...(kind === "listing" ? { clearImage } : {}),
        }),
      });
      show(hidden ? "از فید مخفی شد" : "دوباره نمایشی شد");
      await load();
      setAuditNonce((n) => n + 1);
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
          <h1 className="text-[20px] font-semibold">محتوا</h1>
          <AdminCount loading={loading}>
            {toPersianDigits(total)} مورد · آگهی، درخواست، رویداد
          </AdminCount>
        </div>
        <AdminTabs
          label="نوع محتوا"
          value={kind}
          onChange={setKind}
          items={KINDS.map((key) => ({
            key,
            label: CONTENT_KIND_LABELS[key],
          }))}
        />
      </div>

      <div className="admin-toolbar">
        <label className="sr-only" htmlFor="admin-content-q">
          جستجوی محتوا
        </label>
        <input
          id="admin-content-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="عنوان یا شناسه"
          className="admin-input"
        />
        <AdminTabs
          label="وضعیت نمایش"
          value={visibility}
          onChange={setVisibility}
          items={
            [
              { key: "all", label: "همه" },
              { key: "visible", label: "نمایشی" },
              { key: "hidden", label: "مخفی" },
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
                  <th>عنوان</th>
                  <th>صاحب</th>
                  <th className="hidden xl:table-cell">زمان</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const active = selected?.id === row.id;
                  const meta =
                    kind === "listing"
                      ? listingTypeLabels[row.type as ListingType] ?? row.type
                      : kind === "event"
                        ? eventKindLabels[row.kind as EventKind] ?? row.kind
                        : row.category;
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
                        <p className="font-medium">{row.title}</p>
                        <p className="text-[11px] text-ink-faint">
                          {meta}
                          {row.city ? ` · ${row.city}` : ""}
                        </p>
                      </td>
                      <td>
                        <p>{row.owner.name || "—"}</p>
                        <p
                          className="whitespace-nowrap font-mono text-[11px] text-ink-faint"
                          dir="ltr"
                        >
                          {row.owner.phone}
                        </p>
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-faint xl:table-cell">
                        {faAdminDate(row.createdAt)}
                      </td>
                      <td>
                        <AdminPill tone={row.hidden ? "warn" : "ok"}>
                          {row.hidden ? "مخفی" : "نمایشی"}
                        </AdminPill>
                      </td>
                    </tr>
                  );
                })}
                {!loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-ink-faint">
                      محتوایی در این فیلتر نیست
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
              <p className="text-[13px] text-ink-faint">یک مورد را انتخاب کن</p>
            ) : (
              <div className="space-y-3 text-[13px]">
                <h2 className="text-[15px] font-semibold leading-snug">
                  {selected.title}
                </h2>
                <p className="text-ink-muted">{faAdminDate(selected.createdAt)}</p>
                {selected.dateLabel ? (
                  <p className="text-ink-muted">تاریخ: {selected.dateLabel}</p>
                ) : null}
                <div>
                  <p className="text-[11px] text-ink-faint">صاحب</p>
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
                <p className="text-[12px] text-ink-muted">
                  عکس: {selected.hasImage ? "دارد" : "ندارد"}
                </p>

                {canSeeAudit || canWrite ? (
                  <div className="border-t border-black/5 pt-3 dark:border-white/10">
                    <p className="text-[11px] text-ink-faint">
                      اقدامات روی این {CONTENT_KIND_LABELS[kind]}
                      {auditLoading && !audit.length
                        ? ""
                        : ` · ${toPersianDigits(auditTotal)}`}
                    </p>
                    {auditLoading && !audit.length ? (
                      <p className="mt-2 text-[12px] text-ink-faint">
                        در حال خواندن…
                      </p>
                    ) : audit.length === 0 ? (
                      <p className="mt-2 text-[12px] text-ink-faint">
                        هنوز عملی روی این {CONTENT_KIND_LABELS[kind]} ثبت نشده
                      </p>
                    ) : (
                      <>
                        <ul className="mt-2">
                          {audit.map((row) => (
                            <li
                              key={row.id}
                              className="border-t border-black/5 py-2 first:border-0 first:pt-0 dark:border-white/10"
                            >
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="font-medium">
                                  {AUDIT_ACTION_LABELS[row.action] ??
                                    row.action}
                                </p>
                                <p className="whitespace-nowrap text-[12px] text-ink-faint">
                                  {faAdminDate(row.createdAt)}
                                </p>
                              </div>
                              <p className="text-[12px] text-ink-muted">
                                {row.actor.name || "—"} ·{" "}
                                {ADMIN_ROLE_LABELS[row.actor.role] ??
                                  row.actor.role}
                              </p>
                              {row.reason ? (
                                <p className="mt-1">{row.reason}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                        <AdminLoadMore
                          shown={audit.length}
                          total={auditTotal}
                          loading={auditMore}
                          onLoad={() => void loadMoreAudit()}
                          inset={false}
                        />
                      </>
                    )}
                  </div>
                ) : null}

                {canWrite ? (
                  <div className="space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
                    {kind === "listing" ? (
                      <div className="flex items-center justify-between gap-3">
                        <span>حذف عکس آگهی</span>
                        <AdminSwitch
                          checked={clearImage}
                          label="حذف عکس آگهی"
                          onChange={setClearImage}
                        />
                      </div>
                    ) : null}
                    {!selected.hidden ? (
                      <div className="flex items-center justify-between gap-3">
                        <span>پیام سیستمی به صاحب</span>
                        <AdminSwitch
                          checked={noticeToOwner}
                          label="پیام سیستمی به صاحب"
                          onChange={setNoticeToOwner}
                        />
                      </div>
                    ) : null}
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="دلیل برای لاگ (اختیاری)"
                      className="admin-input"
                      rows={2}
                    />
                    {selected.hidden ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void moderate(false)}
                        className="admin-btn w-full rounded-xl bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {saving ? "…" : "برگردان به فید"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void moderate(true)}
                        className="admin-btn w-full rounded-xl border border-black/10 py-2 disabled:opacity-60 dark:border-white/15"
                      >
                        {saving ? "…" : "مخفی از فید"}
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

export default function AdminContentPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <ContentBody />
    </Suspense>
  );
}
