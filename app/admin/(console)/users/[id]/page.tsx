"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  ADMIN_ROLE_LABELS,
  AUDIT_ACTION_LABELS,
  AUDIT_TARGET_LABELS,
  INVITE_KIND_LABELS,
  INVITE_STATUS_LABELS,
} from "@/lib/admin-labels";
import { levelLabels, listingTypeLabels, relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import type { ListingType, RelationType, TrustLevel } from "@/lib/types";
import { BackIcon } from "@/components/Icons";
import {
  AdminLoadMore,
  AdminPill,
  AdminSkeleton,
  faAdminDate,
  mergeById,
} from "@/components/admin/AdminBits";
import { AdminUserActions } from "@/components/admin/AdminUserActions";

type Detail = {
  user: {
    id: string;
    name: string;
    phone: string;
    city: string | null;
    profileCompletedAt: string | null;
    createdAt: string;
    ban: {
      banned: boolean;
      bannedAt: string | null;
      bannedUntil: string | null;
      banReason: string | null;
      permanent: boolean;
    };
    sessions: {
      id: string;
      createdAt: string;
      expiresAt: string;
      active: boolean;
    }[];
    counts: {
      circle: number;
      circledBy: number;
      listings: number;
      invitesSent: number;
      sessions: number;
      sessionsActive: number;
    };
    circle: {
      id: string;
      trustGroup: string;
      relationType: string;
      displayName: string | null;
      person: { id: string; name: string; phone: string };
    }[];
    invites: {
      id: string;
      code: string;
      kind: string;
      status: string;
      useCount: number;
      maxUses: number;
      expiresAt: string;
      invitedName: string | null;
    }[];
    listings: {
      id: string;
      title: string;
      type: string;
      dealStatus: string | null;
      createdAt: string;
    }[];
    joinRequests: {
      id: string;
      createdAt: string;
      guest: { id: string; name: string; phone: string };
    }[];
  };
};

type FileAuditItem = {
  id: string;
  action: string;
  targetType: string;
  targetLabel: string | null;
  reason: string | null;
  createdAt: string;
  actor: { name: string; role: string };
};

const AUDIT_PAGE = 20;

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-panel p-4">
      <h2 className="mb-3 text-[14px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [audit, setAudit] = useState<FileAuditItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditMore, setAuditMore] = useState(false);
  const [canSeeAudit, setCanSeeAudit] = useState(false);

  const load = useCallback(async () => {
    const d = await api<Detail>(`/api/admin/users/${params.id}`);
    setData(d);
    setError(null);
    setAuditLoading(true);
    try {
      const logs = await api<{
        items: FileAuditItem[];
        meta: { total: number };
      }>(
        `/api/admin/audit?aboutUser=${encodeURIComponent(params.id)}&limit=${AUDIT_PAGE}&skip=0`,
      );
      setAudit(logs.items);
      setAuditTotal(logs.meta.total);
      setCanSeeAudit(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setCanSeeAudit(false);
        setAudit([]);
        setAuditTotal(0);
      }
    } finally {
      setAuditLoading(false);
    }
  }, [params.id]);

  async function loadMoreAudit() {
    if (auditMore || audit.length >= auditTotal) return;
    setAuditMore(true);
    try {
      const logs = await api<{
        items: FileAuditItem[];
        meta: { total: number };
      }>(
        `/api/admin/audit?aboutUser=${encodeURIComponent(params.id)}&limit=${AUDIT_PAGE}&skip=${audit.length}`,
      );
      setAudit((cur) => mergeById(cur, logs.items));
      setAuditTotal(logs.meta.total);
    } finally {
      setAuditMore(false);
    }
  }

  useEffect(() => {
    let live = true;
    api<{ admin: { role: string } }>("/api/admin/auth/me")
      .then((d) => {
        if (live) setRole(d.admin.role);
      })
      .catch(() => {
        if (live) setRole(null);
      });
    load().catch((err) => {
      if (live) {
        setError(err instanceof ApiError ? err.message : "خواندن کاربر نشد");
      }
    });
    return () => {
      live = false;
    };
  }, [load]);

  if (error) {
    return (
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-[13px] text-brand-700"
        >
          <BackIcon className="h-4 w-4" />
          کاربران
        </Link>
        <p role="alert" className="mt-3 text-[13px] text-red-600">
          {error}
        </p>
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        <h1 className="mb-4 text-[20px] font-semibold">کاربر</h1>
        <AdminSkeleton rows={8} />
      </div>
    );
  }

  const u = data.user;
  const showAudit =
    canSeeAudit || role === "moderator" || role === "superadmin";
  return (
    <div className="space-y-4">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-[13px] text-brand-700 hover:underline"
      >
        <BackIcon className="h-4 w-4" />
        کاربران
      </Link>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <header className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[20px] font-semibold">{u.name || "بدون نام"}</h1>
          {u.ban.banned ? (
            <AdminPill tone="warn">
              {u.ban.permanent ? "مسدود دائم" : "مسدود موقت"}
            </AdminPill>
          ) : null}
        </div>
        <p className="font-mono text-[13px] text-ink-muted" dir="ltr">
          {u.phone}
        </p>
        <p className="text-[12px] text-ink-faint">
          {u.city || "بدون شهر"} · عضویت {faAdminDate(u.createdAt)} · پروفایل{" "}
          {u.profileCompletedAt ? "کامل" : "ناقص"}
        </p>
        <p className="mt-1 text-[12px] text-ink-muted">
          سشن فعال {toPersianDigits(u.counts.sessionsActive)} از{" "}
          {toPersianDigits(u.counts.sessions)} · در حلقه دیگران{" "}
          {toPersianDigits(u.counts.circledBy)}
        </p>
      </header>

      <div className="min-w-0 xl:w-[24rem] xl:shrink-0">
      <AdminUserActions
        userId={u.id}
        ban={u.ban}
        sessions={u.sessions}
        sessionsActive={u.counts.sessionsActive}
        role={role}
        onChanged={load}
      />
      </div>
      </div>

      {showAudit ? (
        <Block
          title={`اقدامات روی این پرونده (${toPersianDigits(auditTotal)})`}
        >
          {auditLoading && !audit.length ? (
            <AdminSkeleton rows={4} />
          ) : audit.length === 0 ? (
            <p className="text-[13px] text-ink-faint">
              هنوز عملی روی این حساب ثبت نشده
            </p>
          ) : (
            <>
              <ul className="text-[13px]">
                {audit.map((row) => {
                  const related =
                    row.targetType !== "User" && row.targetLabel
                      ? row.targetLabel
                      : null;
                  return (
                    <li
                      key={row.id}
                      className="border-t border-black/5 py-2.5 first:border-0 first:pt-0 dark:border-white/10"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium">
                          {AUDIT_ACTION_LABELS[row.action] ?? row.action}
                          {related ? (
                            <span className="font-normal text-ink-muted">
                              {" "}
                              · {related}
                            </span>
                          ) : null}
                        </p>
                        <p className="whitespace-nowrap text-[12px] text-ink-faint">
                          {faAdminDate(row.createdAt)}
                        </p>
                      </div>
                      <p className="text-[12px] text-ink-muted">
                        {row.actor.name || "—"} ·{" "}
                        {ADMIN_ROLE_LABELS[row.actor.role] ?? row.actor.role}
                        {row.targetType !== "User" ? (
                          <>
                            {" "}
                            ·{" "}
                            {AUDIT_TARGET_LABELS[row.targetType] ??
                              row.targetType}
                          </>
                        ) : null}
                      </p>
                      {row.reason ? (
                        <p className="mt-1">{row.reason}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <AdminLoadMore
                shown={audit.length}
                total={auditTotal}
                loading={auditMore}
                onLoad={() => void loadMoreAudit()}
                inset={false}
              />
              <p className="mt-2">
                <Link
                  href="/admin/audit"
                  className="text-[12.5px] text-brand-700 hover:underline"
                >
                  همهٔ لاگ عملیات
                </Link>
              </p>
            </>
          )}
        </Block>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Block title={`حلقه (${toPersianDigits(u.counts.circle)})`}>
          {u.circle.length === 0 ? (
            <p className="text-[13px] text-ink-faint">هنوز کسی اضافه نشده</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {u.circle.map((edge) => (
                <li
                  key={edge.id}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <Link
                    href={`/admin/users/${edge.person.id}`}
                    className="text-brand-700 hover:underline"
                  >
                    {edge.displayName || edge.person.name || "بدون نام"}
                  </Link>
                  <span className="text-ink-faint">
                    {relationLabels[edge.relationType as RelationType] ??
                      edge.relationType}{" "}
                    ·{" "}
                    {levelLabels[edge.trustGroup as TrustLevel] ??
                      edge.trustGroup}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block
          title={`دعوت‌های فرستاده (${toPersianDigits(u.counts.invitesSent)})`}
        >
          {u.invites.length === 0 ? (
            <p className="text-[13px] text-ink-faint">دعوتی نیست</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {u.invites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <span>
                    <span className="font-mono" dir="ltr">
                      {inv.code}
                    </span>
                    {inv.invitedName ? ` · ${inv.invitedName}` : ""}
                    {` · ${INVITE_KIND_LABELS[inv.kind] ?? inv.kind}`}
                  </span>
                  <span className="text-ink-faint">
                    {INVITE_STATUS_LABELS[inv.status] ?? inv.status} ·{" "}
                    {toPersianDigits(inv.useCount)}/{toPersianDigits(inv.maxUses)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block title={`آگهی‌ها (${toPersianDigits(u.counts.listings)})`}>
          {u.listings.length === 0 ? (
            <p className="text-[13px] text-ink-faint">آگهی ندارد</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {u.listings.map((listing) => (
                <li
                  key={listing.id}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <span>{listing.title}</span>
                  <span className="text-ink-faint">
                    {listingTypeLabels[listing.type as ListingType] ??
                      listing.type}
                    {listing.dealStatus === "inactive" ? " · مخفی" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>

        <Block
          title={`درخواست پیوستن باز (${toPersianDigits(u.joinRequests.length)})`}
        >
          {u.joinRequests.length === 0 ? (
            <p className="text-[13px] text-ink-faint">درخواستی باز نیست</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {u.joinRequests.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <Link
                    href={`/admin/users/${row.guest.id}`}
                    className="text-brand-700 hover:underline"
                  >
                    {row.guest.name || "بدون نام"}
                  </Link>
                  <span className="text-ink-faint">
                    {faAdminDate(row.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Block>
      </div>
    </div>
  );
}
