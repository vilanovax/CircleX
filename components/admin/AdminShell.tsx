"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BellIcon,
  ChartBarsIcon,
  CircleUsersIcon,
  ClockIcon,
  DoorLeaveIcon,
  FlagIcon,
  GearIcon,
  HomeIcon,
  MegaphoneIcon,
  SendIcon,
  ShieldCheckIcon,
  SidebarRailIcon,
  TagIcon,
  UserIcon,
  ArchiveIcon,
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
  { href: "/admin/watches", label: "گوش‌به‌زنگ", icon: BellIcon, users: false, ops: false, super: false, mods: false },
  { href: "/admin/users", label: "کاربران", icon: UserIcon, users: true, ops: false, super: false, mods: false },
  { href: "/admin/invites", label: "دعوت", icon: SendIcon, users: false, ops: false, super: false, mods: false },
  { href: "/admin/content", label: "محتوا", icon: TagIcon, users: false, ops: false, super: false, mods: false },
  { href: "/admin/broadcasts", label: "اعلامیه", icon: MegaphoneIcon, users: false, ops: true, super: false, mods: false },
  { href: "/admin/settings", label: "تنظیمات", icon: GearIcon, users: false, ops: true, super: false, mods: false },
  { href: "/admin/backup", label: "بک‌آپ", icon: ArchiveIcon, users: false, ops: true, super: true, mods: false },
  { href: "/admin/audit", label: "لاگ", icon: ClockIcon, users: false, ops: true, super: false, mods: true },
  { href: "/admin/operators", label: "اپراتور", icon: ShieldCheckIcon, users: false, ops: true, super: true, mods: false },
] as const;

const NAV_COOKIE = "circle_admin_nav";

function persistPinned(next: boolean) {
  const path = process.env.NEXT_PUBLIC_BASE_PATH || "/";
  const secure = location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${NAV_COOKIE}=${next ? "open" : "rail"};path=${path};max-age=31536000;samesite=lax${secure}`;
}

export default function AdminShell({
  admin,
  children,
  navPinned = false,
}: {
  admin: Admin;
  children: React.ReactNode;
  navPinned?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pinned, setPinned] = useState(navPinned);
  const [peek, setPeek] = useState(false);
  const canHover = useRef(false);
  const enterTimer = useRef<number>();
  const leaveTimer = useRef<number>();

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 861px)");
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => {
      canHover.current = desktop.matches && hover.matches;
      if (!desktop.matches) setPeek(false);
    };
    sync();
    desktop.addEventListener("change", sync);
    hover.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      hover.removeEventListener("change", sync);
      window.clearTimeout(enterTimer.current);
      window.clearTimeout(leaveTimer.current);
    };
  }, []);

  const open = pinned || peek;
  const overlay = open && !pinned;

  const onRailEnter = useCallback(() => {
    if (pinned || !canHover.current) return;
    window.clearTimeout(leaveTimer.current);
    enterTimer.current = window.setTimeout(() => setPeek(true), 90);
  }, [pinned]);

  const onRailLeave = useCallback(() => {
    if (pinned) return;
    window.clearTimeout(enterTimer.current);
    leaveTimer.current = window.setTimeout(() => setPeek(false), 140);
  }, [pinned]);

  const onRailFocus = useCallback(() => {
    if (pinned || !canHover.current) return;
    window.clearTimeout(leaveTimer.current);
    setPeek(true);
  }, [pinned]);

  const onRailBlur = useCallback((event: React.FocusEvent<HTMLElement>) => {
    if (pinned) return;
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setPeek(false);
  }, [pinned]);

  function togglePinned() {
    const next = !pinned;
    setPinned(next);
    setPeek(false);
    persistPinned(next);
  }

  async function logout() {
    try {
      await api("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // still leave
    }
    router.replace("/admin/login");
    router.refresh();
  }

  const items = NAV.filter((item) => {
    if (admin.role === "analyst" && item.users) return false;
    if (item.mods && admin.role !== "moderator" && admin.role !== "superadmin") {
      return false;
    }
    if (item.super && admin.role !== "superadmin") return false;
    return true;
  });

  const initial = (admin.name.trim()[0] || admin.email[0] || "س").toUpperCase();
  const roleLabel = ADMIN_ROLE_LABELS[admin.role] ?? admin.role;

  return (
    <div className="admin-shell" data-nav-pinned={pinned ? "true" : "false"}>
      <aside
        className="admin-sidebar"
        data-open={open ? "true" : "false"}
        data-overlay={overlay ? "true" : "false"}
        aria-expanded={open}
        onMouseEnter={onRailEnter}
        onMouseLeave={onRailLeave}
        onFocus={onRailFocus}
        onBlur={onRailBlur}
      >
        <div className="admin-sidebar-head">
          <Link href="/admin" className="admin-sidebar-brand">
            <span className="admin-mark" aria-hidden>
              <CircleUsersIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="admin-nav-copy">
              <span className="admin-sidebar-title">سیرکل</span>
              <span className="admin-sidebar-sub text-ink-faint">پنل عملیات</span>
            </span>
          </Link>
          <div className="admin-sidebar-mobile-user">
            <div className="min-w-0 text-end">
              <p className="truncate text-[12px] font-medium">{admin.name}</p>
              <p className="truncate text-[11px] text-ink-faint">{roleLabel}</p>
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
        <nav aria-label="بخش‌های پنل" className="admin-sidebar-nav">
          {items.map((item, index, list) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const showOpsRule = item.ops && index > 0 && !list[index - 1]?.ops;
            return (
              <span key={item.href} className="contents">
                {showOpsRule ? <span className="admin-nav-rule" aria-hidden /> : null}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`admin-nav-link ${
                    active
                      ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                      : "text-ink-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="admin-nav-ico" />
                  <span className="admin-nav-copy">{item.label}</span>
                </Link>
              </span>
            );
          })}
        </nav>
        <div className="admin-sidebar-foot">
          <button
            type="button"
            onClick={togglePinned}
            aria-pressed={pinned}
            aria-label={pinned ? "جمع کردن منو" : "باز نگه داشتن منو"}
            className="admin-nav-link admin-nav-toggle text-ink-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <SidebarRailIcon className="admin-nav-ico" />
            <span className="admin-nav-copy">{pinned ? "جمع کردن منو" : "باز نگه داشتن"}</span>
          </button>
          <div className="admin-sidebar-user" title={`${admin.name} · ${roleLabel}`}>
            <span className="admin-nav-avatar" aria-hidden>
              {initial}
            </span>
            <span className="admin-nav-copy">
              <span className="block truncate text-[13px] font-medium leading-tight">{admin.name}</span>
              <span className="block truncate text-[11px] text-ink-faint">{roleLabel}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="خروج"
            className="admin-nav-link text-ink-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <DoorLeaveIcon className="admin-nav-ico" />
            <span className="admin-nav-copy">خروج</span>
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-main-inner">{children}</div>
      </div>
    </div>
  );
}
