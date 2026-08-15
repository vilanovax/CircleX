"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import LoginGate from "@/components/LoginGate";
import WhoAreYouSheet from "@/components/WhoAreYouSheet";
import { HomeBootSkeleton } from "@/components/Skeleton";
import { peekPendingInviteName } from "@/lib/invite";

/**
 * App-wide auth shell. Invite landing stays public. After OTP, identity
 * sheet blocks the rest of the app until the profile has a name.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const sessionPhone = useStore((s) => s.sessionPhone);
  const profileCompletedAt = useStore((s) => s.profileCompletedAt);

  const isInviteLanding = pathname.startsWith("/invite/");

  if (!hydrated) {
    if (isInviteLanding) return <>{children}</>;
    return <HomeBootSkeleton />;
  }

  if (!sessionPhone) {
    if (isInviteLanding) return <>{children}</>;
    const name = peekPendingInviteName();
    return <LoginGate inviteFrom={name ? { name } : null} />;
  }

  if (!profileCompletedAt) {
    return (
      <>
        {isInviteLanding ? children : null}
        <WhoAreYouSheet />
      </>
    );
  }

  return <>{children}</>;
}
