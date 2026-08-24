import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminSkeleton } from "@/components/admin/AdminBits";
import { getAdminSession } from "@/lib/admin-auth";
import {
  loadAdminDashboard,
  type AdminDashboard,
  type AdminDayPoint,
} from "@/lib/admin-metrics";
import { toPersianDigits } from "@/lib/persian";

function WeekBars({ series }: { series: AdminDayPoint[] }) {
  const max = Math.max(1, ...series.map((row) => row.users));
  return (
    <div
      className="admin-bars h-[11.5rem]"
      role="img"
      aria-label="کاربر جدید هفت روز"
    >
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
                style={{ height: `${Math.max(12, pct)}%` }}
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

function QueueHot({
  href,
  label,
  hint,
  value,
}: {
  href: string;
  label: string;
  hint: string;
  value: number;
}) {
  return (
    <Link href={href} prefetch className="admin-queue-hot-card">
      <span className="admin-queue-hot-value">{toPersianDigits(value)}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium leading-snug">{label}</span>
        <span className="mt-0.5 block text-[12px] text-ink-faint">{hint}</span>
      </span>
      <span className="admin-queue-hot-go">باز کردن</span>
    </Link>
  );
}

function PulseCell({
  label,
  value,
  hint,
  href,
  warn,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  warn?: boolean;
}) {
  const inner = (
    <>
      <p className="text-[12px] leading-snug text-ink-muted">{label}</p>
      <p className="admin-pulse-value mt-1">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-ink-faint">{hint}</p> : null}
    </>
  );
  const cls = `admin-pulse-cell${warn ? " is-warn" : ""}`;
  if (!href) return <div className={cls}>{inner}</div>;
  return (
    <Link href={href} prefetch className={cls}>
      {inner}
    </Link>
  );
}

function HealthChip({
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
      prefetch
      className={`admin-health-chip ${ok ? "is-on" : ""}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${ok ? "bg-levelA" : "bg-current opacity-40"}`}
        aria-hidden
      />
      {label}
      <span className="text-[11px]">{ok ? "وصل" : "خاموش"}</span>
    </Link>
  );
}

function DashboardFallback() {
  return (
    <div>
      <h1 className="mb-4 text-[20px] font-semibold">داشبورد</h1>
      <AdminSkeleton rows={8} />
    </div>
  );
}

function DashboardView({ data }: { data: AdminDashboard }) {
  const s = data.stats;
  const today = new Date().toLocaleDateString("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const weekUsers = data.series.reduce((sum, row) => sum + row.users, 0);
  const hasChart = weekUsers > 0;

  const queue = [
    data.viewer.canSeeUsers
      ? {
          href: "/admin/users?profile=incomplete",
          label: "پروفایل ناقص",
          hint: "نام هنوز ثبت نشده",
          value: s.usersIncomplete,
        }
      : null,
    {
      href: "/admin/reports",
      label: "گزارش آگهی باز",
      hint: "صف بررسی",
      value: s.reportsOpen,
    },
    {
      href: "/admin/reports?kind=message",
      label: "گزارش پیام باز",
      hint: "یک پیام، نه کل گفتگو",
      value: s.messageReportsOpen,
    },
    {
      href: "/admin/invites",
      label: "درخواست پیوستن باز",
      hint: "صف میزبان‌ها",
      value: s.joinPending,
    },
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  const hot = queue.filter((row) => row.value > 0);
  const quiet = queue.filter((row) => row.value === 0);
  const workCount = hot.reduce((sum, row) => sum + row.value, 0);

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="text-[20px] font-semibold">داشبورد</h1>
          <p className="text-[13px] text-ink-faint">
            {today}
            {workCount > 0
              ? ` · ${toPersianDigits(workCount)} مورد در صف`
              : " · صف امروز خالی است"}
          </p>
        </div>
        <Link
          href="/admin/growth"
          prefetch
          className="admin-btn rounded-xl border border-black/10 px-3 py-2 text-[12.5px] hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.05]"
        >
          رشد ۱۴ روز
        </Link>
      </div>

      <section aria-labelledby="queue-h" className="admin-queue">
        <h2 id="queue-h" className="sr-only">
          صف کار
        </h2>
        {hot.length > 0 ? (
          <div className="admin-queue-hot">
            {hot.map((row) => (
              <QueueHot key={row.href} {...row} />
            ))}
          </div>
        ) : (
          <p className="admin-queue-empty">چیزی برای بررسی فوری نیست.</p>
        )}
        {quiet.length > 0 ? (
          <p className="admin-queue-quiet">
            <span className="text-ink-faint">صفر · </span>
            {quiet.map((row, i) => (
              <span key={row.href}>
                {i > 0 ? <span className="text-ink-faint">، </span> : null}
                <Link href={row.href} prefetch className="hover:text-brand-700">
                  {row.label}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </section>

      {!hasChart ? (
        <p className="admin-dash-note">
          کاربر جدیدی در این ۷ روز نبود.{" "}
          <Link href="/admin/growth" prefetch className="text-brand-700 hover:underline">
            قیف دعوت
          </Link>
        </p>
      ) : null}

      <div className="admin-dash-body">
        {hasChart ? (
          <section className="admin-panel admin-dash-chart p-4" aria-labelledby="week-h">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="week-h" className="text-[13px] font-medium text-ink-muted">
                کاربر جدید · ۷ روز
                <span className="me-2 text-ink-faint">
                  {" "}
                  · {toPersianDigits(weekUsers)} نفر
                </span>
              </h2>
              <Link href="/admin/growth" prefetch className="text-[12.5px] text-brand-700 hover:underline">
                قیف دعوت
              </Link>
            </div>
            <WeekBars series={data.series} />
          </section>
        ) : null}

        <section className="admin-panel admin-pulse-panel" aria-labelledby="pulse-h">
          <h2 id="pulse-h" className="admin-pulse-heading">
            نبض شبکه
          </h2>
          <div className="admin-pulse-grid">
            <PulseCell
              label="کاربر جدید"
              value={toPersianDigits(s.users24h)}
              hint={`${toPersianDigits(s.users7d)} در ۷ روز`}
            />
            <PulseCell
              label="دعوت زنده"
              value={toPersianDigits(s.invitesLive)}
              hint={`${toPersianDigits(s.invitesExpiredPending)} منقضی‌شده`}
              href="/admin/invites"
            />
            <PulseCell
              label="آگهی مخفی‌شده"
              value={toPersianDigits(s.listingsHidden)}
              hint="از فید برداشته شده"
              href="/admin/content?hidden=1"
              warn={s.listingsHidden > 0}
            />
            <PulseCell
              label="نرخ پذیرش دعوت"
              value={`${pct(s.inviteAcceptRate)}٪`}
              hint={`${toPersianDigits(s.invitesAccepted)} از ${toPersianDigits(s.invitesTotal)}`}
            />
            <PulseCell
              label="آگهی / درخواست / رویداد"
              value={`${toPersianDigits(s.listings24h)} / ${toPersianDigits(s.requests24h)} / ${toPersianDigits(s.events24h)}`}
              hint="۲۴ ساعت"
            />
            {data.viewer.canSeeUsers ? (
              <PulseCell
                label="حساب مسدود"
                value={toPersianDigits(s.usersBanned)}
                hint="ورود بسته است"
                href="/admin/users?banned=1"
                warn={s.usersBanned > 0}
              />
            ) : null}
            <PulseCell label="سشن فعال کاربر" value={toPersianDigits(s.sessionsActive)} />
            <PulseCell
              label="OTP قفل‌شده"
              value={toPersianDigits(s.otpLocked)}
              hint="چالش با سقف تلاش"
              href="/admin/settings?tab=auth"
              warn={s.otpLocked > 0}
            />
          </div>
          <div className="admin-health-row">
            <HealthChip ok={data.health.smsConfigured} label="پیامک کاوه‌نگار" href="/admin/settings" />
            <HealthChip
              ok={data.health.openaiConfigured}
              label="بازنویسی آگهی"
              href="/admin/settings?tab=flags"
            />
            <HealthChip ok={data.health.uploadDirReady} label="آپلود" href="/admin/settings" />
            <HealthChip ok={data.health.webhookConfigured} label="وب‌هوک گزارش" href="/admin/settings" />
          </div>
        </section>
      </div>
    </div>
  );
}

async function DashboardLoaded() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  try {
    const data = await loadAdminDashboard(admin.role);
    return <DashboardView data={data} />;
  } catch {
    return (
      <p role="alert" className="text-[13px] text-red-600">
        خواندن داشبورد نشد
      </p>
    );
  }
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardLoaded />
    </Suspense>
  );
}
