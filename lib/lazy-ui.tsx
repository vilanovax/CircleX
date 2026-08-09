"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactElement } from "react";

/** Code-split a client UI variant; load only when that tree mounts. */
export function lazyUi<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options?: { loading?: () => ReactElement | null },
) {
  return dynamic(loader, {
    ssr: false,
    ...(options?.loading ? { loading: options.loading } : {}),
  });
}
