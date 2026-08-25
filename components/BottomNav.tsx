"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { toPersianDigits } from "@/lib/persian";
import { lazyUi } from "@/lib/lazy-ui";
import { navActive, useClientPathname } from "@/lib/use-nav-active";
import {
  ChatIcon,
  CircleUsersIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "./Icons";

const CreateSheet = lazyUi(() => import("./CreateSheet"));

const items = [
  { id: "home", href: "/", label: "خانه", Icon: HomeIcon },
  { id: "circle", href: "/circle", label: "حلقه‌ی من", Icon: CircleUsersIcon },
  { id: "create", label: "ثبت", Icon: PlusIcon, center: true },
  { id: "messages", href: "/messages", label: "پیام‌ها", Icon: ChatIcon },
  { id: "profile", href: "/profile", label: "پروفایل", Icon: UserIcon },
] as const;

export default function BottomNav() {
  const pathname = useClientPathname();
  // Hide until logged-in + onboarded so new users never see seeded unread (۴).
  const unread = useStore((s) =>
    s.hydrated && s.sessionPhone && s.onboarded ? s.threadIndex.totalUnread : 0,
  );
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
    <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="app-shell !min-h-0 !shadow-none bg-transparent">
        <div className="pointer-events-auto bg-[color:var(--circle-surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-stone-200/70 dark:border-zinc-800 shadow-nav px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          <ul className="flex items-end justify-between">
            {items.map((item) => {
              const { id, label, Icon } = item;
              const href = "href" in item ? item.href : undefined;
              const center = "center" in item && item.center;
              const active = navActive(pathname, href);
              if (center) {
                return (
                  <li key={id} className="flex-1 flex justify-center">
                    <button
                      onClick={() => setShowCreate(true)}
                      aria-label="آگهی، درخواست یا رویداد جدید"
                      className="flex flex-col items-center gap-0.5 -mt-6 active:scale-95 transition-transform duration-150"
                    >
                      <span className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-600/20 ring-2 ring-[color:var(--circle-surface)] dark:ring-zinc-900 active:bg-brand-700">
                        <Icon className="w-6 h-6" />
                      </span>
                      <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                        {label}
                      </span>
                    </button>
                  </li>
                );
              }
              const badge = href === "/messages" && unread > 0 ? unread : 0;
              return (
                <li key={id} className="flex-1">
                  <Link
                    href={href!}
                    className={`flex flex-col items-center gap-0.5 py-1 transition-colors ${
                      active ? "text-brand-600 dark:text-brand-400" : "text-stone-500 dark:text-zinc-400"
                    }`}
                  >
                    <span className="relative">
                      <Icon className="w-6 h-6" />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -left-2 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center nums ring-2 ring-white dark:ring-zinc-900">
                          {toPersianDigits(badge)}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

    </nav>
    {showCreate && <CreateSheet onClose={() => setShowCreate(false)} />}
    </>
  );
}
