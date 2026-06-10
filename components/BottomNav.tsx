"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChatIcon,
  CircleUsersIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "./Icons";

const items = [
  { href: "/", label: "خانه", Icon: HomeIcon },
  { href: "/circle", label: "حلقه‌ی من", Icon: CircleUsersIcon },
  { href: "/new", label: "ثبت آگهی", Icon: PlusIcon, center: true },
  { href: "/messages", label: "پیام‌ها", Icon: ChatIcon },
  { href: "/profile", label: "پروفایل", Icon: UserIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="app-shell !min-h-0 !shadow-none bg-transparent">
        <div className="pointer-events-auto bg-white/95 backdrop-blur border-t border-zinc-100 shadow-nav px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          <ul className="flex items-end justify-between">
            {items.map(({ href, label, Icon, center }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              if (center) {
                return (
                  <li key={href} className="flex-1 flex justify-center">
                    <Link
                      href={href}
                      aria-label={label}
                      className="-mt-6 w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 active:bg-brand-700 transition-colors"
                    >
                      <Icon className="w-7 h-7" />
                    </Link>
                  </li>
                );
              }
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    className={`flex flex-col items-center gap-0.5 py-1 transition-colors ${
                      active ? "text-brand-600" : "text-zinc-400"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
