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

  if (isAdmin) {
    return (
      <ToastProvider>
        <div className="admin-root">{children}</div>
      </ToastProvider>
    );
  }

  return (
    <StoreProvider initialUser={boot.user} initialHome={boot.home}>
      <ToastProvider>
        <div className="app-shell">
          <RequireAuth>{children}</RequireAuth>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}
