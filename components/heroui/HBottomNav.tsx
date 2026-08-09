"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button } from "@heroui/react";
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
} from "@/components/Icons";

const CreateSheet = lazyUi(() => import("@/components/CreateSheet"));

const items = [
  { id: "home", href: "/", label: "خانه", Icon: HomeIcon },
  { id: "circle", href: "/circle", label: "حلقه‌ی من", Icon: CircleUsersIcon },
  { id: "create", label: "ثبت", Icon: PlusIcon, center: true },
  { id: "messages", href: "/messages", label: "پیام‌ها", Icon: ChatIcon },
  { id: "profile", href: "/profile", label: "پروفایل", Icon: UserIcon },
] as const;

/** HeroUI variant of the bottom navigation bar. */
export default function HBottomNav() {
  const pathname = useClientPathname();
  const unread = useStore((s) => s.totalUnread());
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="mx-auto max-w-[480px] pointer-events-auto">
          <div className="bg-background/95 backdrop-blur border-t border-divider px-2 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-1px_12px_rgba(16,24,40,0.06)]">
            <ul className="flex items-end justify-between">
              {items.map((item) => {
                const { id, label, Icon } = item;
                const href = "href" in item ? item.href : undefined;
                const center = "center" in item && item.center;
                const active = navActive(pathname, href);

                if (center) {
                  return (
                    <li key={id} className="flex-1 flex justify-center">
                      <Button
                        isIconOnly
                        color="primary"
                        radius="full"
                        aria-label="ثبت آگهی، درخواست یا رویداد"
                        onPress={() => setShowCreate(true)}
                        className="-mt-6 w-14 h-14 shadow-lg"
                      >
                        <Icon className="w-7 h-7" />
                      </Button>
                    </li>
                  );
                }

                const badge = href === "/messages" && unread > 0 ? unread : 0;
                return (
                  <li key={id} className="flex-1">
                    <Link
                      href={href!}
                      className={`flex flex-col items-center gap-0.5 py-1 ${active ? "text-primary" : "text-default-400"}`}
                    >
                      {badge > 0 ? (
                        <Badge content={toPersianDigits(badge)} color="primary" size="sm" shape="circle">
                          <Icon className="w-6 h-6" />
                        </Badge>
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
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
