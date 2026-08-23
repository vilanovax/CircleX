"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  INVITE_KIND_LABELS,
  INVITE_STATUS_LABELS,
} from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import {
  AdminPill,
  AdminSkeleton,
  AdminCount,
  AdminTabs,
  AdminLoadMore,
  faAdminDate,
  mergeById,
} from "@/components/admin/AdminBits";

type Person = { id: string; name: string; phone: string };

type InviteItem = {
  id: string;
  code: string;
  kind: string;
  status: string;
  useCount: number;
  maxUses: number;
  invitedName: string | null;
  invitedPhone: string | null;
  expiresAt: string;
  createdAt: string;
  live: boolean;
  burst: boolean;
  inviter: Person;
};

type JoinItem = {
  id: string;
  status: string;
  createdAt: string;
  host: Person;
  guest: Person;
  invite: { id: string; code: string; kind: string } | null;
};

type Me = { admin: { role: string } };

const PAGE_SIZE = 50;
const JOIN_PAGE_SIZE = 30;

export default function AdminInvitesPage() {
  const { show } = useToast();
  const [status, setStatus] = useState<
    "pending" | "accepted" | "expired" | "revoked" | "all"
  >("pending");
  const [kind, setKind] = useState<"all" | "personal" | "wave">("all");
  const [items, setItems] = useState<InviteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [bursts, setBursts] = useState<{ inviterUserId: string; count: number }[]>(
    [],
  );
  const [selected, setSelected] = useState<InviteItem | null>(null);
  const [joins, setJoins] = useState<JoinItem[]>([]);
  const [joinTotal, setJoinTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreJoins, setLoadingMoreJoins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: "0",
      });
      if (status !== "all") params.set("status", status);
      if (kind !== "all") params.set("kind", kind);
      const [invites, joinData] = await Promise.all([
        api<{
          items: InviteItem[];
          meta: { total: number };
          bursts: { inviterUserId: string; count: number }[];
        }>(`/api/admin/invites?${params.toString()}`),
        api<{ items: JoinItem[]; meta: { total: number } }>(
          `/api/admin/join-requests?status=pending&limit=${JOIN_PAGE_SIZE}&skip=0`,
        ),
      ]);
      setItems(invites.items);
      setTotal(invites.meta.total);
      setBursts(invites.bursts ?? []);
      setJoins(joinData.items);
      setJoinTotal(joinData.meta.total);
      setSelected((cur) =>
        cur
          ? invites.items.find((row) => row.id === cur.id) ??
            invites.items[0] ??
            null
          : invites.items[0] ?? null,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خواندن دعوت‌ها نشد");
    } finally {
      setLoading(false);
    }
  }, [status, kind]);

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
      if (status !== "all") params.set("status", status);
      if (kind !== "all") params.set("kind", kind);
      const data = await api<{
        items: InviteItem[];
        meta: { total: number };
      }>(`/api/admin/invites?${params.toString()}`);
      setItems((cur) => mergeById(cur, data.items));
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه فهرست خوانده نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadMoreJoins() {
    if (loadingMoreJoins || joins.length >= joinTotal) return;
    setLoadingMoreJoins(true);
    setError(null);
    try {
      const data = await api<{ items: JoinItem[]; meta: { total: number } }>(
        `/api/admin/join-requests?status=pending&limit=${JOIN_PAGE_SIZE}&skip=${joins.length}`,
      );
      setJoins((cur) => mergeById(cur, data.items));
      setJoinTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه صف خوانده نشد");
    } finally {
      setLoadingMoreJoins(false);
    }
  }

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

  useEffect(() => {
    setReason("");
  }, [selected?.id]);

  async function act(action: "revoke" | "extend") {
    if (!selected) return;
    setSaving(true);
    try {
      await api(`/api/admin/invites/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, reason }),
      });
      show(action === "revoke" ? "دعوت لغو شد" : "مهلت تمدید شد");
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ذخیره نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="admin-page-head">
          <div>
            <h1 className="text-[20px] font-semibold">دعوت‌ها</h1>
            <AdminCount loading={loading}>
              {toPersianDigits(total)} دعوت در این فیلتر
            </AdminCount>
          </div>
          <div className="admin-page-head-actions">
            <AdminTabs
              label="وضعیت دعوت"
              value={status}
              onChange={setStatus}
              items={
                [
                  { key: "pending", label: INVITE_STATUS_LABELS.pending },
                  { key: "accepted", label: INVITE_STATUS_LABELS.accepted },
                  { key: "expired", label: INVITE_STATUS_LABELS.expired },
                  { key: "revoked", label: INVITE_STATUS_LABELS.revoked },
                  { key: "all", label: "همه" },
                ] as const
              }
            />
            <AdminTabs
              label="نوع دعوت"
              value={kind}
              onChange={setKind}
              items={
                [
                  { key: "all", label: "هر دو نوع" },
                  { key: "personal", label: INVITE_KIND_LABELS.personal },
                  { key: "wave", label: INVITE_KIND_LABELS.wave },
                ] as const
              }
            />
          </div>
        </div>

        {bursts.length > 0 ? (
          <p className="mb-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-[13px] dark:border-brand-500/30 dark:bg-brand-500/10">
            {toPersianDigits(bursts.length)} نفر در ۲۴ ساعت گذشته بیش از هشت دعوت
            ساخته‌اند — موج غیرعادی را چک کن.
          </p>
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
            <div className="admin-panel admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>کد</th>
                    <th>فرستنده</th>
                    <th>ظرفیت</th>
                    <th className="hidden xl:table-cell">انقضا</th>
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
                          <p className="font-mono" dir="ltr">
                            {row.code}
                          </p>
                          <p className="text-[11px] text-ink-faint">
                            {INVITE_KIND_LABELS[row.kind] ?? row.kind}
                            {row.burst ? " · موج تازه" : ""}
                          </p>
                        </td>
                        <td>
                          <p>{row.inviter.name || "—"}</p>
                          <p
                            className="whitespace-nowrap font-mono text-[11px] text-ink-faint"
                            dir="ltr"
                          >
                            {row.inviter.phone}
                          </p>
                        </td>
                        <td>
                          {toPersianDigits(row.useCount)}/
                          {toPersianDigits(row.maxUses)}
                        </td>
                        <td className="hidden whitespace-nowrap text-ink-faint xl:table-cell">
                          {faAdminDate(row.expiresAt)}
                        </td>
                        <td>
                          <AdminPill
                            tone={
                              row.live ? "ok" : row.status === "revoked" ? "warn" : "muted"
                            }
                          >
                            {row.live
                              ? "زنده"
                              : INVITE_STATUS_LABELS[row.status] ?? row.status}
                          </AdminPill>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-ink-faint">
                        دعوتی در این فیلتر نیست
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
                <p className="text-[13px] text-ink-faint">یک دعوت را انتخاب کن</p>
              ) : (
                <div className="space-y-3 text-[13px]">
                  <h2 className="font-mono text-[15px]" dir="ltr">
                    {selected.code}
                  </h2>
                  <p className="text-ink-muted">
                    {INVITE_KIND_LABELS[selected.kind]} · ساخت{" "}
                    {faAdminDate(selected.createdAt)}
                  </p>
                  <p className="text-ink-muted">
                    انقضا {faAdminDate(selected.expiresAt)}
                  </p>
                  {selected.invitedName || selected.invitedPhone ? (
                    <p>
                      مهمان: {selected.invitedName || "—"}
                      {selected.invitedPhone ? (
                        <>
                          {" · "}
                          <span className="font-mono text-[11px]" dir="ltr">
                            {selected.invitedPhone}
                          </span>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  <div>
                    <p className="text-[11px] text-ink-faint">فرستنده</p>
                    <Link
                      href={`/admin/users/${selected.inviter.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {selected.inviter.name || "بدون نام"}
                    </Link>
                  </div>
                  {canWrite &&
                  (selected.status === "pending" ||
                    selected.status === "expired") ? (
                    <div className="space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="دلیل برای لاگ (اختیاری)"
                        className="admin-input"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        {selected.status === "pending" ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void act("revoke")}
                            className="admin-btn flex-1 rounded-xl border border-black/10 py-2 disabled:opacity-60 dark:border-white/15"
                          >
                            لغو
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void act("extend")}
                          className="admin-btn flex-1 rounded-xl bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                          تمدید ۷ روز
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      <section>
        <h2 className="mb-1 text-[15px] font-semibold">درخواست پیوستن باز</h2>
        <AdminCount loading={loading} className="mb-3">
          {toPersianDigits(joinTotal)} مورد · پذیرش با میزبان است، اینجا فقط صف
          دیده می‌شود
        </AdminCount>
        {loading && !joins.length ? (
          <AdminSkeleton rows={3} />
        ) : (
        <div className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>مهمان</th>
                <th>میزبان</th>
                <th>دعوت</th>
                <th>زمان</th>
              </tr>
            </thead>
            <tbody>
              {joins.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={`/admin/users/${row.guest.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {row.guest.name || "بدون نام"}
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/admin/users/${row.host.id}`}
                      className="text-brand-700 hover:underline"
                    >
                      {row.host.name || "بدون نام"}
                    </Link>
                  </td>
                  <td className="font-mono" dir="ltr">
                    {row.invite?.code ?? "—"}
                  </td>
                  <td className="text-ink-faint">{faAdminDate(row.createdAt)}</td>
                </tr>
              ))}
              {joins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-ink-faint">
                    صف خالی است
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <AdminLoadMore
            shown={joins.length}
            total={joinTotal}
            loading={loadingMoreJoins}
            onLoad={() => void loadMoreJoins()}
          />
        </div>
        )}
      </section>
    </div>
  );
}
