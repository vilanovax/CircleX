"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";
import RequireAuth from "@/components/RequireAuth";
import type { AppBoot } from "@/lib/home-types";

export default function AppFrame({
  children,
  boot,
}: {
  children: ReactNode;
  boot: AppBoot;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  // Keep StoreProvider mounted across admin ↔ member soft-nav so home does
  // not remount empty and re-fetch. Admin chrome never uses the member store.
  return (
    <StoreProvider initialUser={boot.user} initialHome={boot.home}>
      <ToastProvider>
        {isAdmin ? (
          <div className="admin-root">{children}</div>
        ) : (
          <div className="app-shell">
            <RequireAuth>{children}</RequireAuth>
          </div>
        )}
      </ToastProvider>
    </StoreProvider>
  );
}
