"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Box, Indicator, Text, useMantineTheme } from "@mantine/core";
import { useStore } from "@/lib/store";
import { toPersianDigits } from "@/lib/persian";
import CreateSheet from "@/components/CreateSheet";
import {
  ChatIcon,
  CircleUsersIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "@/components/Icons";
import { SHELL_MAX } from "./shared";

const items = [
  { id: "home", href: "/", label: "خانه", Icon: HomeIcon },
  { id: "circle", href: "/circle", label: "حلقه‌ی من", Icon: CircleUsersIcon },
  { id: "create", label: "ثبت", Icon: PlusIcon, center: true },
  { id: "messages", href: "/messages", label: "پیام‌ها", Icon: ChatIcon },
  { id: "profile", href: "/profile", label: "پروفایل", Icon: UserIcon },
] as const;

/** Mantine variant of the bottom navigation bar. */
export default function MBottomNav() {
  const pathname = usePathname();
  const theme = useMantineTheme();
  const { totalUnread } = useStore();
  const unread = totalUnread();
  const [showCreate, setShowCreate] = useState(false);
  const brand = theme.colors.brand[6];

  return (
    <>
      <Box
        component="nav"
        style={{
          position: "fixed",
          insetInline: 0,
          bottom: 0,
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <Box mx="auto" style={{ maxWidth: SHELL_MAX, pointerEvents: "auto" }}>
          <Box
            style={{
              backdropFilter: "blur(8px)",
              borderTop: "1px solid var(--mantine-color-default-border)",
              background: "var(--mantine-color-body)",
              boxShadow: "0 -1px 12px rgba(16,24,40,0.06)",
              paddingInline: 8,
              paddingTop: 6,
              paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))",
            }}
          >
            <Box
              component="ul"
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
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
                    <Box component="li" key={id} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                      <button
                        onClick={() => setShowCreate(true)}
                        aria-label="ثبت آگهی، درخواست یا رویداد"
                        style={{
                          marginTop: -24,
                          width: 56,
                          height: 56,
                          borderRadius: "9999px",
                          background: brand,
                          color: "#fff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 8px 18px ${brand}55`,
                          cursor: "pointer",
                        }}
                      >
                        <Icon className="w-7 h-7" />
                      </button>
                    </Box>
                  );
                }

                const badge = href === "/messages" && unread > 0 ? unread : 0;
                return (
                  <Box component="li" key={id} style={{ flex: 1 }}>
                    <Link
                      href={href!}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        paddingBlock: 4,
                        textDecoration: "none",
                        color: active ? brand : "var(--mantine-color-dimmed)",
                      }}
                    >
                      <Indicator
                        disabled={badge === 0}
                        label={badge > 0 ? toPersianDigits(badge) : undefined}
                        size={16}
                        color="brand"
                        offset={2}
                      >
                        <Icon className="w-6 h-6" />
                      </Indicator>
                      <Text fz={11} fw={500}>
                        {label}
                      </Text>
                    </Link>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
      {showCreate && <CreateSheet onClose={() => setShowCreate(false)} />}
    </>
  );
}
