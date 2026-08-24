"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { withBasePath } from "@/lib/avatar";
import { AdminSkeleton, faAdminDate } from "@/components/admin/AdminBits";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";

type BackupSummary = {
  format: number;
  generatedAt: string;
  counts: Record<string, number>;
  uploadFiles: number;
  uploadBytes: number;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const TABLE_LABELS: Record<string, string> = {
  users: "کاربران",
  sessions: "نشست کاربر",
  otpChallenges: "کد ورود",
  invites: "دعوت",
  inviteExpected: "مهمان دعوت",
  inviteAcceptances: "پذیرش دعوت",
  circleJoinRequests: "درخواست عضویت",
  circleEdges: "یال حلقه",
  listings: "آگهی",
  listingEndorsements: "تأیید آگهی",
  listingReports: "گزارش آگهی",
  messages: "پیام",
  messageReports: "گزارش پیام",
  requests: "درخواست",
  requestOffers: "پیشنهاد درخواست",
  events: "رویداد",
  eventRsvps: "حضور رویداد",
  savedListings: "نشان آگهی",
  listingViews: "نمایش آگهی",
  listingWatches: "گوش‌به‌زنگ",
  systemNotices: "اعلان سیرکلو",
  threadPreferences: "ترجیح گفتگو",
  adminUsers: "اپراتور",
  adminSessions: "نشست ادمین",
  adminAuditLogs: "لاگ ادمین",
  appSettings: "تنظیمات",
  broadcasts: "اعلامیه",
};

export default function BackupClient() {
  const { show } = useToast();
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await api<BackupSummary>("/api/admin/backup"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "خلاصه بک‌آپ خوانده نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function download() {
    if (downloading) return;
    const ok = window.confirm(
      "فایل کامل شامل شماره، پیام، نشست و عکس آگهی‌هاست. ذخیره می‌کنی؟",
    );
    if (!ok) return;
    setDownloading(true);
    try {
      const res = await fetch(withBasePath("/api/admin/backup?download=1"), {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        let message = "دانلود نشد";
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const header = res.headers.get("Content-Disposition") ?? "";
      const match = header.match(/filename="([^"]+)"/);
      const name = match?.[1] ?? "circle-backup.json";
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      show("فایل بک‌آپ ذخیره شد");
      void load();
    } catch (err) {
      show(err instanceof Error ? err.message : "دانلود نشد");
    } finally {
      setDownloading(false);
    }
  }

  const rows = summary
    ? Object.entries(summary.counts).sort((a, b) => a[0].localeCompare(b[0]))
    : [];
  const totalRows = summary
    ? Object.values(summary.counts).reduce((n, v) => n + v, 0)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-semibold text-ink dark:text-zinc-50">
            بک‌آپ
          </h1>
          <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-muted">
            یک فایل JSON از تمام جدول‌ها و عکس‌های آپلودشدهٔ آگهی. کم‌وکسر
            ندارد؛ فقط superadmin می‌بیند.
          </p>
        </div>
        <button
          type="button"
          disabled={loading || downloading || !summary}
          onClick={() => void download()}
          className="admin-btn rounded-xl bg-brand-600 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {downloading ? "در حال ساخت…" : "دانلود بک‌آپ کامل"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-[13px] text-red-600">
          {error}
        </p>
      ) : null}

      {loading || !summary ? (
        <AdminSkeleton rows={8} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="admin-panel px-3 py-3">
              <p className="text-[12.5px] text-ink-faint">ردیف دیتابیس</p>
              <p className="mt-1 nums text-[20px] font-semibold">
                {toPersianDigits(totalRows)}
              </p>
            </div>
            <div className="admin-panel px-3 py-3">
              <p className="text-[12.5px] text-ink-faint">عکس آگهی</p>
              <p className="mt-1 nums text-[20px] font-semibold">
                {toPersianDigits(summary.uploadFiles)}
              </p>
            </div>
            <div className="admin-panel px-3 py-3">
              <p className="text-[12.5px] text-ink-faint">حجم عکس</p>
              <p className="mt-1 nums text-[20px] font-semibold">
                {formatBytes(summary.uploadBytes)}
              </p>
            </div>
            <div className="admin-panel px-3 py-3">
              <p className="text-[12.5px] text-ink-faint">شمارش</p>
              <p className="mt-1 text-[14px] font-medium">
                {faAdminDate(summary.generatedAt)}
              </p>
            </div>
          </div>

          <div className="admin-panel overflow-hidden">
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.06] text-[12.5px] text-ink-faint dark:border-white/[0.08]">
                  <th className="px-3 py-2 font-medium">جدول</th>
                  <th className="px-3 py-2 font-medium">تعداد</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([key, count]) => (
                  <tr
                    key={key}
                    className="border-b border-black/[0.04] last:border-0 dark:border-white/[0.06]"
                  >
                    <td className="px-3 py-2">{TABLE_LABELS[key] ?? key}</td>
                    <td className="nums px-3 py-2">{toPersianDigits(count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
