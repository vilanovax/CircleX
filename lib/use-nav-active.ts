"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Pathname for nav highlighting, available only after hydration.
 * With `basePath: "/circle"` and a route also named `/circle`, SSR and the
 * first client paint can disagree on `usePathname()`, which triggers a
 * className hydration mismatch on bottom-nav links.
 */
export function useClientPathname(): string | null {
  const pathname = usePathname() || "/";
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  return isClient ? pathname : null;
}

export function navActive(pathname: string | null, href: string | undefined): boolean {
  if (!pathname || !href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function useNavActive(href: string | undefined): boolean {
  return navActive(useClientPathname(), href);
}
