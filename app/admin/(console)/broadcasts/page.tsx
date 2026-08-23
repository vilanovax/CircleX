"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { BROADCAST_AUDIENCE_LABELS } from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import {
  AdminPill,
  AdminSkeleton,
  faAdminDate,
} from "@/components/admin/AdminBits";

type Item = {
  id: string;
  title: string;
  body: string;
  actionHref: string | null;
  actionLabel: string | null;
  audience: string;
  audienceLabel: string;
  sentCount: number;
  createdAt: string;
};

type Me = { admin: { role: string } };

export default function AdminBroadcastsPage() {
  const { show } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionHref, setActionHref] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [audience, setAudience] = useState<"all" | "incomplete">("incomplete");
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, me] = await Promise.all([
        api<{ items: Item[]; meta: { total: number } }>(
          "/api/admin/broadcasts?limit=40",
        ),
        api<Me>("/api/admin/auth/me"),
      ]);
      setItems(list.items);
      setTotal(list.meta.total);
      setCanSend(
        me.admin.role === "superadmin" || me.admin.role === "moderator",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "اعلامیه‌ها خوانده نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    if (!canSend || sending) return;
    setSending(true);
    try {
      const result = await api<{ sentCount: number }>("/api/admin/broadcasts", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          actionHref: actionHref.trim() || undefined,
          actionLabel: actionLabel.trim() || undefined,
          audience,
          confirm,
        }),
      });
      show(`اعلامیه برای ${toPersianDigits(result.sentCount)} نفر رفت`);
      setTitle("");
      setBody("");
      setActionHref("");
      setActionLabel("");
      setConfirm(false);
      await load();
    } catch (err) {
      show(err instanceof ApiError ? err.message : "ارسال نشد");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <section className="admin-panel h-fit p-4 lg:sticky lg:top-4">
        <h1 className="text-[20px] font-semibold">اعلامیه</h1>
        <p className="mt-1 text-[12.5px] text-ink-faint">
          پیام در صندوق سیرکلو می‌نشیند. حداکثر ۴۰۰ نفر در هر ارسال.
        </p>
        {loading ? (
          <div className="mt-4">
            <AdminSkeleton rows={5} />
          </div>
        ) : canSend ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-medium">عنوان</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="admin-input"
                maxLength={80}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-medium">متن</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="admin-input min-h-[7rem] resize-y"
                maxLength={500}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12.5px] font-medium">مخاطب</span>
              <select
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value === "all" ? "all" : "incomplete")
                }
                className="admin-input"
              >
                <option value="incomplete">
                  {BROADCAST_AUDIENCE_LABELS.incomplete}
                </option>
                <option value="all">{BROADCAST_AUDIENCE_LABELS.all}</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">
                  لینک (اختیاری)
                </span>
                <input
                  value={actionHref}
                  onChange={(e) => setActionHref(e.target.value)}
                  className="admin-input"
                  placeholder="/profile"
                  dir="ltr"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12.5px] font-medium">
                  برچسب دکمه
                </span>
                <input
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  className="admin-input"
                  placeholder="باز کردن"
                />
              </label>
            </div>
            <label className="flex items-start gap-2 rounded-xl bg-black/[0.03] px-3 py-2.5 text-[12.5px] dark:bg-white/[0.05]">
              <input
                type="checkbox"
                className="mt-0.5 accent-brand-600"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
              />
              <span>
                می‌دانم این پیام برای مخاطب انتخاب‌شده در صندوق سیرکلو می‌رود و
                قابل پس‌گرفتن نیست.
              </span>
            </label>
            <button
              type="submit"
              disabled={sending || !confirm}
              className="admin-btn w-full rounded-xl bg-brand-600 py-2.5 text-[13.5px] font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {sending ? "در حال ارسال…" : "ارسال اعلامیه"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-[13px] text-ink-muted">
            ارسال فقط برای ناظر و مدیر کل است.
          </p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-medium">تاریخچه</h2>
          {!loading ? (
            <p className="text-[12px] text-ink-faint">
              {toPersianDigits(total)} اعلامیه
            </p>
          ) : null}
        </div>
        {loading ? (
          <AdminSkeleton rows={6} />
        ) : error ? (
          <p role="alert" className="text-[13px] text-red-600">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="admin-panel px-4 py-8 text-center text-[13px] text-ink-muted">
            هنوز اعلامیه‌ای نرفته
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <article key={item.id} className="admin-panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-[14.5px] font-medium">{item.title}</h3>
                  <AdminPill>
                    {item.sentCount > 0
                      ? `${toPersianDigits(item.sentCount)} نفر · ${item.audienceLabel}`
                      : `کسی در این مخاطب نبود · ${item.audienceLabel}`}
                  </AdminPill>
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
                  {item.body}
                </p>
                {item.actionHref ? (
                  <p className="mt-2 text-[12px] text-brand-700" dir="ltr">
                    {item.actionLabel} → {item.actionHref}
                  </p>
                ) : null}
                <p className="mt-2 text-[11.5px] text-ink-faint">
                  {faAdminDate(item.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
