"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { toPersianDigits } from "@/lib/persian";
import CreateSheet from "./CreateSheet";
import {
  ChatIcon,
  CircleUsersIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "./Icons";

const items = [
  { id: "home", href: "/", label: "خانه", Icon: HomeIcon },
  { id: "circle", href: "/circle", label: "حلقه‌ی من", Icon: CircleUsersIcon },
  { id: "create", label: "ثبت", Icon: PlusIcon, center: true },
  { id: "messages", href: "/messages", label: "پیام‌ها", Icon: ChatIcon },
  { id: "profile", href: "/profile", label: "پروفایل", Icon: UserIcon },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { totalUnread } = useStore();
  const unread = totalUnread();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="app-shell !min-h-0 !shadow-none bg-transparent">
        <div className="pointer-events-auto bg-white/95 backdrop-blur border-t border-zinc-100 shadow-nav px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          <ul className="flex items-end justify-between">
            {items.map((item) => {
              const { id, label, Icon } = item;
              const href = "href" in item ? item.href : undefined;
              const center = "center" in item && item.center;
              const active =
                href === "/"
                  ? pathname === "/"
                  : href
                    ? pathname.startsWith(href)
                    : false;
              if (center) {
                return (
                  <li key={id} className="flex-1 flex justify-center">
                    <button
                      onClick={() => setShowCreate(true)}
                      aria-label="ثبت آگهی، درخواست یا رویداد"
                      className="-mt-6 w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 active:bg-brand-700 transition-colors"
                    >
                      <Icon className="w-7 h-7" />
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
                      active ? "text-brand-600" : "text-zinc-400"
                    }`}
                  >
                    <span className="relative">
                      <Icon className="w-6 h-6" />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -left-2 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center nums ring-2 ring-white">
                          {toPersianDigits(badge)}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {showCreate && <CreateSheet onClose={() => setShowCreate(false)} />}
    </nav>
  );
}
