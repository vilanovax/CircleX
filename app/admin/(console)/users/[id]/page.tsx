"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  INVITE_KIND_LABELS,
  INVITE_STATUS_LABELS,
} from "@/lib/admin-labels";
import { levelLabels, listingTypeLabels, relationLabels } from "@/lib/labels";
import { toPersianDigits } from "@/lib/persian";
import type { ListingType, RelationType, TrustLevel } from "@/lib/types";
import { BackIcon } from "@/components/Icons";
import { AdminSkeleton, AdminPill, faAdminDate } from "@/components/admin/AdminBits";
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

  const load = useCallback(async () => {
    const d = await api<Detail>(`/api/admin/users/${params.id}`);
    setData(d);
    setError(null);
  }, [params.id]);

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
  return (
    <div className="space-y-4">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-[13px] text-brand-700 hover:underline"
      >
        <BackIcon className="h-4 w-4" />
        کاربران
      </Link>
      <header>
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

      <AdminUserActions
        userId={u.id}
        ban={u.ban}
        sessions={u.sessions}
        sessionsActive={u.counts.sessionsActive}
        role={role}
        onChanged={load}
      />

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
