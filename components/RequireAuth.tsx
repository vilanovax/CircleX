"use client";

import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import LoginGate from "@/components/LoginGate";

/**
 * App-wide auth shell. Every route stays behind mock phone/OTP until
 * `sessionPhone` is set. Shows a short settle state while store hydrates
 * so seeded feed never flashes for logged-out users.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const sessionPhone = useStore((s) => s.sessionPhone);

  if (!hydrated) {
    return (
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-[color:var(--circle-canvas)]"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="w-9 h-9 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
          aria-hidden
        />
        <p className="text-[12px] text-ink-faint">در حال آماده‌سازی…</p>
      </div>
    );
  }

  if (!sessionPhone) {
    return <LoginGate />;
  }

  return <>{children}</>;
}
