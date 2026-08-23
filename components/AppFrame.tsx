"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";
import RequireAuth from "@/components/RequireAuth";

export default function AppFrame({ children }: { children: ReactNode }) {
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
    <StoreProvider>
      <ToastProvider>
        <div className="app-shell">
          <RequireAuth>{children}</RequireAuth>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}
