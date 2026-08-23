"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBarsIcon,
  CircleUsersIcon,
  ClockIcon,
  FlagIcon,
  GearIcon,
  HomeIcon,
  MegaphoneIcon,
  SendIcon,
  ShieldCheckIcon,
  TagIcon,
  UserIcon,
} from "@/components/Icons";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-labels";
import { api } from "@/lib/api";

type AdminRole = "superadmin" | "moderator" | "support" | "analyst";

type Admin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

const NAV = [
  { href: "/admin", label: "داشبورد", icon: HomeIcon, exact: true, users: false, ops: false, super: false, mods: false },
  { href: "/admin/growth", label: "رشد", icon: ChartBarsIcon, users: false, ops: false, super: false, mods: false },
  { href: "/admin/reports", label: "گزارش", icon: FlagIcon, users: false, ops: false, super: false, mods: false },
  { href: "/admin/users", label: "کاربران", icon: UserIcon, users: true, ops: false, super: false, mods: false },
  { href: "/admin/invites", label: "دعوت", icon: SendIcon, users: false, ops: false, super: false, mods: false },
  { href: "/admin/content", label: "محتوا", icon: TagIcon, users: false, ops: false, super: false, mods: false },
  { href: "/admin/broadcasts", label: "اعلامیه", icon: MegaphoneIcon, users: false, ops: true, super: false, mods: false },
  { href: "/admin/settings", label: "تنظیمات", icon: GearIcon, users: false, ops: true, super: false, mods: false },
  { href: "/admin/audit", label: "لاگ", icon: ClockIcon, users: false, ops: true, super: false, mods: true },
  { href: "/admin/operators", label: "اپراتور", icon: ShieldCheckIcon, users: false, ops: true, super: true, mods: false },
] as const;

export default function AdminShell({
  admin,
  children,
}: {
  admin: Admin;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await api("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // still leave
    }
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="flex items-center gap-2 px-1 max-[860px]:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="admin-mark" aria-hidden>
              <CircleUsersIcon className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold leading-tight">سیرکل</p>
              <p className="text-[11px] text-ink-faint">پنل عملیات</p>
            </div>
          </div>
          <div className="hidden min-w-0 items-center gap-3 max-[860px]:flex">
            <div className="min-w-0 text-end">
              <p className="truncate text-[12px] font-medium">{admin.name}</p>
              <p className="truncate text-[11px] text-ink-faint">
                {ADMIN_ROLE_LABELS[admin.role] ?? admin.role}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="admin-btn shrink-0 rounded-xl px-2.5 py-1.5 text-[12.5px] text-ink-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              خروج
            </button>
          </div>
        </div>
        <nav
          aria-label="بخش‌های پنل"
          className="mt-5 flex flex-1 flex-col gap-0.5 max-[860px]:mt-1 max-[860px]:flex-none max-[860px]:flex-row max-[860px]:flex-nowrap max-[860px]:overflow-x-auto max-[860px]:pb-0.5"
        >
          {NAV.filter((item) => {
            if (admin.role === "analyst" && item.users) return false;
            if (item.mods && admin.role !== "moderator" && admin.role !== "superadmin") {
              return false;
            }
            if (item.super && admin.role !== "superadmin") return false;
            return true;
          }).map((item, index, list) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showOpsRule =
              item.ops && index > 0 && !list[index - 1]?.ops;
            return (
              <span key={item.href} className="contents">
                {showOpsRule ? (
                  <span
                    className="my-1.5 hidden h-px bg-black/8 dark:bg-white/10 max-[860px]:hidden"
                    aria-hidden
                  />
                ) : null}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`admin-nav-link flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] transition ${
                    active
                      ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                      : "text-ink-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </span>
            );
          })}
        </nav>
        <div className="mt-3 border-t border-black/5 pt-3 dark:border-white/10 max-[860px]:hidden">
          <div className="min-w-0 px-2">
            <p className="truncate text-[13px] font-medium">{admin.name}</p>
            <p className="truncate text-[11px] text-ink-faint">
              {ADMIN_ROLE_LABELS[admin.role] ?? admin.role}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="admin-btn mt-2 w-full rounded-xl px-3 py-1.5 text-start text-[12.5px] text-ink-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            خروج
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-main-inner">{children}</div>
      </div>
    </div>
  );
}
