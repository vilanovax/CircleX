"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { BROADCAST_AUDIENCE_LABELS } from "@/lib/admin-labels";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";
import {
  AdminCount,
  AdminPill,
  AdminSkeleton,
  AdminLoadMore,
  AdminTabs,
  faAdminDate,
  mergeById,
} from "@/components/admin/AdminBits";

type Audience = "all" | "incomplete";

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

const PAGE_SIZE = 40;
const TITLE_MAX = 80;
const BODY_MAX = 500;

export default function AdminBroadcastsPage() {
  const { show } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [cap, setCap] = useState(400);
  const [audienceCounts, setAudienceCounts] = useState<{
    all: number;
    incomplete: number;
  }>({ all: 0, incomplete: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionHref, setActionHref] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [audience, setAudience] = useState<Audience>("incomplete");
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, me] = await Promise.all([
        api<{
          items: Item[];
          meta: { total: number };
          cap?: number;
          audienceCounts?: { all: number; incomplete: number };
        }>(`/api/admin/broadcasts?limit=${PAGE_SIZE}&skip=0`),
        api<Me>("/api/admin/auth/me"),
      ]);
      setItems(list.items);
      setTotal(list.meta.total);
      if (typeof list.cap === "number") setCap(list.cap);
      if (list.audienceCounts) setAudienceCounts(list.audienceCounts);
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

  async function loadMore() {
    if (loadingMore || items.length >= total) return;
    setLoadingMore(true);
    setError(null);
    try {
      const list = await api<{ items: Item[]; meta: { total: number } }>(
        `/api/admin/broadcasts?limit=${PAGE_SIZE}&skip=${items.length}`,
      );
      setItems((cur) => mergeById(cur, list.items));
      setTotal(list.meta.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "ادامه فهرست خوانده نشد");
    } finally {
      setLoadingMore(false);
    }
  }

  const eligible = audienceCounts[audience];
  const willSend = Math.min(eligible, cap);
  const href = actionHref.trim();
  const label = actionLabel.trim();
  const hrefOk = !href || href.startsWith("/");
  const linkOk = !href || Boolean(label);
  const titleOk = title.trim().length >= 2;
  const bodyOk = body.trim().length >= 2;
  const canSubmit =
    canSend &&
    confirm &&
    titleOk &&
    bodyOk &&
    hrefOk &&
    linkOk &&
    willSend > 0 &&
    !sending;

  const audienceHint = useMemo(() => {
    if (eligible <= 0) return "الان کسی در این مخاطب نیست.";
    if (eligible > cap) {
      return `این مخاطب ${toPersianDigits(eligible)} نفر است؛ این ارسال فقط به ${toPersianDigits(cap)} نفرِ تازه‌تر می‌رسد.`;
    }
    return `این ارسال به ${toPersianDigits(willSend)} نفر می‌رسد.`;
  }, [eligible, cap, willSend]);

  async function send() {
    if (!canSubmit) return;
    setSending(true);
    try {
      const result = await api<{ sentCount: number }>("/api/admin/broadcasts", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          actionHref: href || undefined,
          actionLabel: label || undefined,
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
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">اعلامیه</h1>
          <p className="text-[13px] text-ink-faint">
            در صندوق سیرکلو می‌نشیند و پس گرفته نمی‌شود · سقف هر ارسال{" "}
            {toPersianDigits(cap)} نفر
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(18rem,22.5rem)_minmax(0,1fr)] lg:items-start">
        <aside className="admin-panel h-fit p-4 lg:sticky lg:top-5">
          <h2 className="text-[15px] font-medium">ارسال تازه</h2>
          {loading && !canSend && !error ? (
            <div className="mt-4">
              <AdminSkeleton rows={5} />
            </div>
          ) : canSend ? (
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <label className="block">
                <span className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px] font-medium">
                  عنوان
                  <span className="tabular-nums font-normal text-ink-faint">
                    {toPersianDigits(title.length)} / {toPersianDigits(TITLE_MAX)}
                  </span>
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                  className="admin-input"
                  maxLength={TITLE_MAX}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px] font-medium">
                  متن
                  <span className="tabular-nums font-normal text-ink-faint">
                    {toPersianDigits(body.length)} / {toPersianDigits(BODY_MAX)}
                  </span>
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                  className="admin-input min-h-[7rem] resize-y"
                  maxLength={BODY_MAX}
                  required
                />
              </label>

              <div>
                <p className="mb-1.5 text-[12.5px] font-medium">مخاطب</p>
                <AdminTabs
                  label="مخاطب اعلامیه"
                  value={audience}
                  onChange={(next) => {
                    setAudience(next);
                    setConfirm(false);
                  }}
                  items={
                    [
                      {
                        key: "incomplete" as const,
                        label: `${BROADCAST_AUDIENCE_LABELS.incomplete} · ${toPersianDigits(audienceCounts.incomplete)}`,
                      },
                      {
                        key: "all" as const,
                        label: `${BROADCAST_AUDIENCE_LABELS.all} · ${toPersianDigits(audienceCounts.all)}`,
                      },
                    ] as const
                  }
                />
                <p className="mt-1.5 text-[12px] text-ink-faint">{audienceHint}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[12.5px] font-medium">
                    مسیر لینک
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
                    onChange={(e) => setActionLabel(e.target.value.slice(0, 24))}
                    className="admin-input"
                    placeholder="باز کردن"
                    disabled={!href}
                  />
                </label>
              </div>
              {href && !hrefOk ? (
                <p className="text-[12px] text-red-600">مسیر باید با / شروع شود.</p>
              ) : null}
              {href && hrefOk && !label ? (
                <p className="text-[12px] text-ink-muted">
                  اگر لینک می‌گذاری، برچسب دکمه هم لازم است.
                </p>
              ) : null}

              {title.trim() || body.trim() ? (
                <div className="rounded-xl bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.05]">
                  <p className="text-[11px] text-ink-faint">پیش‌نمایش صندوق</p>
                  <p className="mt-1 text-[13px] font-medium">
                    {title.trim() || "عنوان"}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">
                    {body.trim() || "متن اعلامیه"}
                  </p>
                  {href && hrefOk && label ? (
                    <p className="mt-1.5 text-[12px] text-brand-700">{label}</p>
                  ) : null}
                </div>
              ) : null}

              <label className="flex items-start gap-2 rounded-xl bg-black/[0.03] px-3 py-2.5 text-[12.5px] dark:bg-white/[0.05]">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-brand-600"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  disabled={willSend <= 0}
                />
                <span>
                  می‌دانم این پیام برای «{BROADCAST_AUDIENCE_LABELS[audience]}»
                  {willSend > 0
                    ? ` · ${toPersianDigits(willSend)} نفر`
                    : ""}{" "}
                  می‌رود و پس گرفته نمی‌شود.
                </span>
              </label>
              <button
                type="submit"
                disabled={!canSubmit}
                className="admin-btn w-full rounded-xl bg-brand-600 py-2.5 text-[13.5px] font-medium text-white hover:bg-brand-700 disabled:opacity-40"
              >
                {sending
                  ? "در حال ارسال…"
                  : willSend > 0
                    ? `ارسال به ${toPersianDigits(willSend)} نفر`
                    : "کسی برای ارسال نیست"}
              </button>
            </form>
          ) : (
            <p className="mt-3 text-[13px] text-ink-muted">
              ارسال فقط برای ناظر و مدیر کل است. تاریخچه را می‌توانی ببینی.
            </p>
          )}
        </aside>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-medium">تاریخچه</h2>
            <AdminCount loading={loading}>
              {toPersianDigits(total)} اعلامیه
            </AdminCount>
          </div>
          {error ? (
            <p role="alert" className="mb-3 text-[13px] text-red-600">
              {error}
            </p>
          ) : null}
          {loading && !items.length ? (
            <AdminSkeleton rows={6} />
          ) : items.length === 0 ? (
            <div className="admin-panel px-4 py-8 text-center text-[13px] text-ink-muted">
              هنوز اعلامیه‌ای نرفته. از فرم کنار، اول برای پروفایل ناقص بفرست.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <article key={item.id} className="admin-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-[15px] font-medium">{item.title}</h3>
                    <AdminPill tone={item.sentCount > 0 ? "muted" : "warn"}>
                      {item.sentCount > 0
                        ? `${toPersianDigits(item.sentCount)} نفر · ${item.audienceLabel}`
                        : `کسی نبود · ${item.audienceLabel}`}
                    </AdminPill>
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
                    {item.body}
                  </p>
                  {item.actionHref ? (
                    <p className="mt-2 text-[12px] text-brand-700">
                      دکمه «{item.actionLabel || "باز کردن"}» →{" "}
                      <span dir="ltr">{item.actionHref}</span>
                    </p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-ink-faint">
                    {faAdminDate(item.createdAt)}
                  </p>
                </article>
              ))}
              <AdminLoadMore
                shown={items.length}
                total={total}
                loading={loadingMore}
                onLoad={() => void loadMore()}
                inset={false}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
