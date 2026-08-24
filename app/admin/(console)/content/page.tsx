"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SearchIcon } from "@/components/Icons";
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
type ListingTypeFilter = "all" | ListingType;

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
const LISTING_TYPES: ListingType[] = [
  "sale",
  "donation",
  "exchange",
  "loan",
  "service",
];

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

function publicHref(kind: Kind, id: string): string {
  if (kind === "listing") return `/listing/${id}`;
  if (kind === "request") return `/request/${id}`;
  return `/event/${id}`;
}

function rowMeta(kind: Kind, row: ContentItem): string {
  if (kind === "listing") {
    return listingTypeLabels[row.type as ListingType] ?? row.type ?? "";
  }
  if (kind === "event") {
    return eventKindLabels[row.kind as EventKind] ?? row.kind ?? "";
  }
  return row.category ?? "";
}

function statusPill(row: ContentItem): { label: string; tone: "ok" | "warn" | "muted" } {
  if (row.hidden || row.dealStatus === "inactive") {
    return { label: "مخفی از فید", tone: "warn" };
  }
  if (row.dealStatus === "reserved") return { label: "رزرو", tone: "muted" };
  if (row.dealStatus === "agreed") return { label: "توافق", tone: "muted" };
  return { label: "نمایشی", tone: "ok" };
}

function ContentBody() {
  const searchParams = useSearchParams();
  const initialKind = searchParams.get("kind");
  const initialHidden = searchParams.get("hidden");
  const initialType = searchParams.get("type");
  const initialId = searchParams.get("id");
  const deepLinkId = useRef(initialId);
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
  const [listingType, setListingType] = useState<ListingTypeFilter>(
    LISTING_TYPES.includes(initialType as ListingType)
      ? (initialType as ListingType)
      : "all",
  );
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState(searchParams.get("q") ?? "");
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
    if (kind === "listing" && listingType !== "all") params.set("type", listingType);
    return params;
  }, [debounced, visibility, kind, listingType]);

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
      setSelected((cur) => {
        const keepId = cur?.id ?? deepLinkId.current;
        if (keepId) {
          const match = data.items.find((row) => row.id === keepId);
          if (match) return match;
        }
        return data.items[0] ?? null;
      });
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
    if (kind !== "listing") setListingType("all");
  }, [kind]);

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
      show(
        hidden
          ? clearImage
            ? "مخفی شد و عکس پاک شد"
            : "از فید مخفی شد"
          : "دوباره نمایشی شد",
      );
      await load();
      setAuditNonce((n) => n + 1);
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ذخیره نشد");
    } finally {
      setSaving(false);
    }
  }

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      show("شناسه کپی شد");
    } catch {
      show("کپی نشد");
    }
  }

  const visibilityLabel =
    visibility === "hidden" ? "مخفی" : visibility === "visible" ? "نمایشی" : "همه";
  const selectedStatus = selected ? statusPill(selected) : null;
  const hideLabel =
    kind === "listing" && clearImage ? "مخفی کن و عکس را پاک کن" : "مخفی از فید";

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">محتوا</h1>
          <AdminCount loading={loading}>
            {toPersianDigits(total)} {CONTENT_KIND_LABELS[kind]} · {visibilityLabel}
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
        <div className="relative min-w-0 flex-1 basis-[14rem] max-w-[28rem]">
          <SearchIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="admin-content-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && q) setQ("");
            }}
            placeholder="عنوان یا شناسه"
            className="admin-input w-full pr-9"
          />
        </div>
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
      {kind === "listing" ? (
        <div className="mb-3">
          <AdminTabs
            label="نوع آگهی"
            value={listingType}
            onChange={setListingType}
            items={
              [
                { key: "all" as const, label: "هر نوع" },
                ...LISTING_TYPES.map((key) => ({
                  key,
                  label: listingTypeLabels[key],
                })),
              ] as const
            }
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}

      {loading && !items.length ? (
        <AdminSkeleton />
      ) : (
        <div className="admin-split">
          <div className="admin-panel overflow-hidden">
            <div className="admin-table-wrap max-h-[min(72dvh,44rem)]">
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
                    const meta = rowMeta(kind, row);
                    const pill = statusPill(row);
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
                            {row.hasImage ? " · عکس" : ""}
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
                          <AdminPill tone={pill.tone}>{pill.label}</AdminPill>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center">
                        <p className="text-[14px] font-medium text-ink">
                          {q.trim() || visibility !== "all" || listingType !== "all"
                            ? "موردی با این فیلتر پیدا نشد"
                            : `${CONTENT_KIND_LABELS[kind]}ای نیست`}
                        </p>
                        {q.trim() || visibility !== "all" || listingType !== "all" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setQ("");
                              setVisibility("all");
                              setListingType("all");
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

          <aside className="admin-panel h-fit p-4 lg:sticky lg:top-5">
            {!selected ? (
              <p className="text-[13px] text-ink-faint">یک مورد را از فهرست انتخاب کن</p>
            ) : (
              <div className="space-y-3 text-[13px]">
                <div>
                  <h2 className="text-[15px] font-semibold leading-snug">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-[12px] text-ink-muted">
                    {faAdminDate(selected.createdAt)}
                    {selected.dateLabel ? ` · رویداد ${selected.dateLabel}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <AdminPill tone={selectedStatus?.tone}>
                      {selectedStatus?.label}
                    </AdminPill>
                    {rowMeta(kind, selected) ? (
                      <AdminPill tone="muted">{rowMeta(kind, selected)}</AdminPill>
                    ) : null}
                    {selected.city ? (
                      <AdminPill tone="muted">{selected.city}</AdminPill>
                    ) : null}
                    <AdminPill tone="muted">
                      {selected.hasImage ? "عکس دارد" : "بدون عکس"}
                    </AdminPill>
                  </div>
                </div>

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

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={publicHref(kind, selected.id)}
                    className="admin-btn rounded-lg border border-black/10 px-2.5 py-1 text-[12px] dark:border-white/15"
                  >
                    دیدن در اپ
                  </Link>
                  <button
                    type="button"
                    onClick={() => void copyId(selected.id)}
                    className="admin-btn rounded-lg border border-black/10 px-2.5 py-1 text-[12px] dark:border-white/15"
                  >
                    کپی شناسه
                  </button>
                </div>

                {canSeeAudit || canWrite ? (
                  <div className="border-t border-black/5 pt-3 dark:border-white/10">
                    <p className="text-[11px] text-ink-faint">
                      سابقهٔ نظارت
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
                    <p className="text-[12px] leading-relaxed text-ink-muted">
                      مخفی کردن از فید حلقه برمی‌دارد؛ رکورد پاک نمی‌شود.
                    </p>
                    {kind === "listing" && selected.hasImage && !selected.hidden ? (
                      <div className="flex items-center justify-between gap-3">
                        <span>عکس آگهی هم پاک شود</span>
                        <AdminSwitch
                          checked={clearImage}
                          label="عکس آگهی هم پاک شود"
                          onChange={setClearImage}
                        />
                      </div>
                    ) : null}
                    {!selected.hidden ? (
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span>خبر به صاحب در سیرکلو</span>
                          <AdminSwitch
                            checked={noticeToOwner}
                            label="خبر به صاحب در سیرکلو"
                            onChange={setNoticeToOwner}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-ink-faint">
                          فقط وقتی مخفی می‌کنی فرستاده می‌شود.
                        </p>
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
                        {saving ? "…" : hideLabel}
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
