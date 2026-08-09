"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Box, Fab, Typography } from "@mui/material";
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
import { SHELL_MAX } from "./shared";

const CreateSheet = lazyUi(() => import("@/components/CreateSheet"));

const items = [
  { id: "home", href: "/", label: "خانه", Icon: HomeIcon },
  { id: "circle", href: "/circle", label: "حلقه‌ی من", Icon: CircleUsersIcon },
  { id: "create", label: "ثبت", Icon: PlusIcon, center: true },
  { id: "messages", href: "/messages", label: "پیام‌ها", Icon: ChatIcon },
  { id: "profile", href: "/profile", label: "پروفایل", Icon: UserIcon },
] as const;

/** MUI variant of the bottom navigation bar. */
export default function MuiBottomNav() {
  const pathname = useClientPathname();
  const unread = useStore((s) => s.totalUnread());
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <Box component="nav" sx={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 30, pointerEvents: "none" }}>
        <Box sx={{ mx: "auto", maxWidth: SHELL_MAX, pointerEvents: "auto" }}>
          <Box
            sx={{
              backdropFilter: "blur(8px)",
              bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)"),
              borderTop: 1,
              borderColor: "divider",
              boxShadow: "0 -1px 12px rgba(16,24,40,0.06)",
              px: 1,
              pt: 0.75,
              pb: "max(0.4rem, env(safe-area-inset-bottom))",
            }}
          >
            <Box component="ul" sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", listStyle: "none", m: 0, p: 0 }}>
              {items.map((item) => {
                const { id, label, Icon } = item;
                const href = "href" in item ? item.href : undefined;
                const center = "center" in item && item.center;
                const active = navActive(pathname, href);

                if (center) {
                  return (
                    <Box component="li" key={id} sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                      <Fab
                        color="primary"
                        aria-label="ثبت آگهی، درخواست یا رویداد"
                        onClick={() => setShowCreate(true)}
                        sx={{ mt: "-24px", width: 56, height: 56 }}
                      >
                        <Box component={Icon} className="w-7 h-7" />
                      </Fab>
                    </Box>
                  );
                }

                const badge = href === "/messages" && unread > 0 ? unread : 0;
                return (
                  <Box component="li" key={id} sx={{ flex: 1 }}>
                    <Box
                      component={Link}
                      href={href!}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.25,
                        py: 0.5,
                        textDecoration: "none",
                        color: active ? "primary.main" : "text.disabled",
                      }}
                    >
                      <Badge
                        color="primary"
                        badgeContent={badge > 0 ? toPersianDigits(badge) : undefined}
                        sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}
                      >
                        <Box component={Icon} className="w-6 h-6" />
                      </Badge>
                      <Typography sx={{ fontSize: 11 }} fontWeight={500}>
                        {label}
                      </Typography>
                    </Box>
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
