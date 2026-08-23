"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { toPersianDigits } from "@/lib/persian";
import { AdminSkeleton } from "@/components/admin/AdminBits";

type DayPoint = {
  day: string;
  label: string;
  users: number;
};

type Dashboard = {
  stats: {
    users24h: number;
    users7d: number;
    usersIncomplete: number;
    invitesLive: number;
    invitesExpiredPending: number;
    inviteAcceptRate: number;
    invitesTotal: number;
    invitesAccepted: number;
    listings24h: number;
    requests24h: number;
    events24h: number;
    reportsOpen: number;
    otpLocked: number;
    sessionsActive: number;
    usersBanned: number;
    joinPending: number;
    listingsHidden: number;
  };
  viewer: {
    role: string;
    canSeeUsers: boolean;
  };
  health: {
    smsConfigured: boolean;
    openaiConfigured: boolean;
    uploadDirReady: boolean;
    webhookConfigured: boolean;
  };
};

function WeekBars({ series }: { series: DayPoint[] }) {
  const max = Math.max(1, ...series.map((row) => row.users));
  return (
    <div className="admin-bars" role="img" aria-label="کاربر جدید هفت روز">
      {series.map((row) => {
        const pct = Math.round((row.users / max) * 100);
        return (
          <div
            key={row.day}
            className="admin-bar"
            title={`${row.label}: ${toPersianDigits(row.users)}`}
          >
            <span className="admin-bar-value">
              {row.users > 0 ? toPersianDigits(row.users) : "\u00a0"}
            </span>
            <div className="admin-bar-track">
              <div
                className="admin-bar-fill"
                style={{ height: `${Math.max(row.users > 0 ? 10 : 3, pct)}%` }}
              />
            </div>
            <span className="admin-bar-label">{row.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function pct(n: number): string {
  return toPersianDigits(Math.round(n * 100));
}

function QueueRow({
  href,
  label,
  hint,
  value,
  urgent,
}: {
  href: string;
  label: string;
  hint: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition hover:border-brand-200 ${
        urgent
          ? "border-brand-200 bg-brand-50/70 dark:border-brand-500/30 dark:bg-brand-500/10"
          : "border-black/5 bg-[var(--circle-surface)] dark:border-white/10"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[14px] font-medium">{label}</p>
        <p className="mt-0.5 text-[12px] text-ink-faint">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <p className="text-[22px] font-semibold tabular-nums leading-none">
          {toPersianDigits(value)}
        </p>
        <span
          className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${
            urgent
              ? "bg-[var(--circle-surface)] text-brand-700"
              : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
          }`}
        >
          باز کردن
        </span>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <div>
        <p className="text-[13px]">{label}</p>
        {hint ? (
          <p className="text-[11.5px] text-ink-faint">{hint}</p>
        ) : null}
      </div>
      <p className="shrink-0 text-[15px] font-medium tabular-nums">{value}</p>
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} className="block rounded-xl px-1 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
      {body}
    </Link>
  );
}

function Health({
  ok,
  label,
  href,
}: {
  ok: boolean;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
    >
      <span className="text-ink-muted">{label}</span>
      <span className={`flex items-center gap-1.5 ${ok ? "text-levelA" : "text-ink-faint"}`}>
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-levelA" : "bg-current opacity-40"}`}
          aria-hidden
        />
        {ok ? "وصل" : "خاموش"}
      </span>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [series, setSeries] = useState<DayPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([
      api<Dashboard>("/api/admin/dashboard"),
      api<{ series: DayPoint[] }>("/api/admin/analytics?days=7").catch(
        () => ({ series: [] as DayPoint[] }),
      ),
    ])
      .then(([d, growth]) => {
        if (!live) return;
        setData(d);
        setSeries(growth.series);
      })
      .catch((err) => {
        if (live) {
          setError(err instanceof ApiError ? err.message : "خواندن داشبورد نشد");
        }
      });
    return () => {
      live = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="text-[13px] text-red-600">
        {error}
      </p>
    );
  }
  if (!data) {
    return (
      <div>
        <h1 className="mb-4 text-[20px] font-semibold">داشبورد</h1>
        <AdminSkeleton rows={8} />
      </div>
    );
  }

  const s = data.stats;
  const today = new Date().toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">داشبورد</h1>
          <p className="text-[13px] text-ink-faint">{today} · صف کار امروز</p>
        </div>
        <Link
          href="/admin/growth"
          className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[12.5px] hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.05]"
        >
          رشد ۱۴ روز
        </Link>
      </div>

      <section aria-labelledby="queue-h">
        <h2 id="queue-h" className="mb-2 text-[13px] font-medium text-ink-muted">
          باید بررسی شود
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QueueRow
            href="/admin/reports"
            label="گزارش آگهی باز"
            hint="صف بررسی"
            value={s.reportsOpen}
            urgent={s.reportsOpen > 0}
          />
          {data.viewer.canSeeUsers ? (
            <QueueRow
              href="/admin/users?profile=incomplete"
              label="پروفایل ناقص"
              hint="نام هنوز ثبت نشده"
              value={s.usersIncomplete}
              urgent={s.usersIncomplete > 0}
            />
          ) : null}
          <QueueRow
            href="/admin/invites"
            label="درخواست پیوستن باز"
            hint="صف میزبان‌ها"
            value={s.joinPending}
            urgent={s.joinPending > 0}
          />
        </div>
      </section>

      <div className="admin-dash-secondary mt-4">
        {series.length > 0 ? (
          <section className="admin-panel admin-dash-chart p-4" aria-labelledby="week-h">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="week-h" className="text-[13px] font-medium text-ink-muted">
                کاربر جدید · ۷ روز
              </h2>
              <Link href="/admin/growth" className="text-[12.5px] text-brand-700 hover:underline">
                قیف دعوت
              </Link>
            </div>
            <WeekBars series={series} />
          </section>
        ) : null}

        <div className="admin-dash-stack">
        <section className="admin-panel px-4 py-2" aria-labelledby="pulse-h">
          <h2 id="pulse-h" className="pt-2 text-[13px] font-medium text-ink-muted">
            نبض شبکه
          </h2>
          <Stat
            label="کاربر جدید"
            value={toPersianDigits(s.users24h)}
            hint={`${toPersianDigits(s.users7d)} در ۷ روز`}
          />
          <Stat
            label="دعوت زنده"
            value={toPersianDigits(s.invitesLive)}
            hint={`${toPersianDigits(s.invitesExpiredPending)} منقضی‌شده`}
            href="/admin/invites"
          />
          <Stat
            label="آگهی مخفی‌شده"
            value={toPersianDigits(s.listingsHidden)}
            hint="از فید برداشته شده"
            href="/admin/content?hidden=1"
          />
          {data.viewer.canSeeUsers ? (
            <Stat
              label="حساب مسدود"
              value={toPersianDigits(s.usersBanned)}
              hint="ورود بسته است"
              href="/admin/users?banned=1"
            />
          ) : null}
          <Stat
            label="نرخ پذیرش دعوت"
            value={`${pct(s.inviteAcceptRate)}٪`}
            hint={`${toPersianDigits(s.invitesAccepted)} از ${toPersianDigits(s.invitesTotal)}`}
          />
          <Stat
            label="آگهی / درخواست / رویداد ۲۴س"
            value={`${toPersianDigits(s.listings24h)} / ${toPersianDigits(s.requests24h)} / ${toPersianDigits(s.events24h)}`}
          />
        </section>
        <section className="admin-panel px-4 py-2" aria-labelledby="ops-h">
          <h2 id="ops-h" className="pt-2 text-[13px] font-medium text-ink-muted">
            عملیات
          </h2>
          <Stat label="سشن فعال کاربر" value={toPersianDigits(s.sessionsActive)} />
          <Stat
            label="OTP قفل‌شده"
            value={toPersianDigits(s.otpLocked)}
            hint="چالش با سقف تلاش"
            href="/admin/settings?tab=auth"
          />
          <div className="mt-1 border-t border-black/5 pt-1 dark:border-white/10">
            <Health
              ok={data.health.smsConfigured}
              label="پیامک کاوه‌نگار"
              href="/admin/settings"
            />
            <Health
              ok={data.health.openaiConfigured}
              label="بازنویسی آگهی با AI"
              href="/admin/settings?tab=flags"
            />
            <Health
              ok={data.health.uploadDirReady}
              label="پوشه آپلود"
              href="/admin/settings"
            />
            <Health
              ok={data.health.webhookConfigured}
              label="وب‌هوک گزارش"
              href="/admin/settings"
            />
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
