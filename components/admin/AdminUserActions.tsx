"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import { AdminPill, faAdminDate } from "@/components/admin/AdminBits";

type Ban = {
  banned: boolean;
  bannedAt: string | null;
  bannedUntil: string | null;
  banReason: string | null;
  permanent: boolean;
};

type SessionRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
};

type Me = { admin: { role: string } };

export function AdminUserActions({
  userId,
  ban,
  sessions,
  sessionsActive,
  role,
  onChanged,
}: {
  userId: string;
  ban: Ban;
  sessions: SessionRow[];
  sessionsActive: number;
  role: Me["admin"]["role"] | null;
  onChanged: () => Promise<void>;
}) {
  const { show } = useToast();
  const canBan = role === "moderator" || role === "superadmin";
  const canSessions =
    role === "support" || role === "moderator" || role === "superadmin";
  const [reason, setReason] = useState("");
  const [untilMode, setUntilMode] = useState<"permanent" | "7d" | "30d">(
    "permanent",
  );
  const [saving, setSaving] = useState(false);

  function untilIso(): string | null {
    if (untilMode === "permanent") return null;
    const days = untilMode === "7d" ? 7 : 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  async function banUser() {
    if (reason.trim().length < 3) {
      show("دلیل مسدودسازی را بنویس");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim(), until: untilIso() }),
      });
      show("حساب مسدود شد و سشن‌ها باطل شدند");
      setReason("");
      await onChanged();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "مسدود نشد");
    } finally {
      setSaving(false);
    }
  }

  async function unbanUser() {
    setSaving(true);
    try {
      await api(`/api/admin/users/${userId}/unban`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      show("مسدودسازی برداشته شد");
      setReason("");
      await onChanged();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "رفع مسدود نشد");
    } finally {
      setSaving(false);
    }
  }

  async function revokeSessions() {
    setSaving(true);
    try {
      const data = await api<{ sessionsRevoked: number }>(
        `/api/admin/users/${userId}/sessions/revoke`,
        {
          method: "POST",
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      show(`${toPersianDigits(data.sessionsRevoked)} سشن باطل شد`);
      await onChanged();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "سشن باطل نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold">اقدامات حساب</h2>
        {ban.banned ? (
          <AdminPill tone="warn">
            {ban.permanent ? "مسدود دائم" : "مسدود موقت"}
          </AdminPill>
        ) : (
          <AdminPill tone="ok">فعال</AdminPill>
        )}
      </div>

      {ban.banned ? (
        <p className="text-[13px] text-ink-muted">
          از {ban.bannedAt ? faAdminDate(ban.bannedAt) : "—"}
          {ban.bannedUntil ? ` تا ${faAdminDate(ban.bannedUntil)}` : ""}
          {ban.banReason ? ` · ${ban.banReason}` : ""}
        </p>
      ) : null}

      <p className="text-[13px] text-ink-muted">
        سشن فعال {toPersianDigits(sessionsActive)}
      </p>
      {sessions.length > 0 ? (
        <ul className="space-y-1 text-[12px] text-ink-faint">
          {sessions.map((row) => (
            <li key={row.id} className="flex justify-between gap-2">
              <span>{faAdminDate(row.createdAt)}</span>
              <span>{row.active ? "فعال" : "منقضی"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-ink-faint">سشنی ثبت نشده</p>
      )}

      {canBan || canSessions ? (
        <div className="space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="دلیل برای لاگ"
            className="admin-input"
            rows={2}
          />
          {canBan && !ban.banned ? (
            <div className="flex flex-wrap gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.06]">
              {(
                [
                  ["permanent", "دائم"],
                  ["7d", "۷ روز"],
                  ["30d", "۳۰ روز"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setUntilMode(key)}
                  className={`admin-btn flex-1 rounded-lg px-2 py-1.5 text-[12px] ${
                    untilMode === key
                      ? "bg-[var(--circle-surface)] font-medium shadow-sm"
                      : "text-ink-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {canSessions ? (
              <button
                type="button"
                disabled={saving || sessionsActive === 0}
                onClick={() => void revokeSessions()}
                className="admin-btn flex-1 rounded-xl border border-black/10 py-2 text-[12.5px] disabled:opacity-60 dark:border-white/15"
              >
                ابطال سشن‌ها
              </button>
            ) : null}
            {canBan && !ban.banned ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void banUser()}
                className="admin-btn flex-1 rounded-xl bg-red-700 py-2 text-[12.5px] text-white hover:bg-red-800 disabled:opacity-60"
              >
                مسدود کن
              </button>
            ) : null}
            {canBan && ban.banned ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void unbanUser()}
                className="admin-btn flex-1 rounded-xl bg-brand-600 py-2 text-[12.5px] text-white hover:bg-brand-700 disabled:opacity-60"
              >
                رفع مسدود
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-ink-faint">این نقش اقدامی ندارد.</p>
      )}
    </section>
  );
}
