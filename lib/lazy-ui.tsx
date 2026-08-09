"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** Code-split a client UI variant; load only when that tree mounts. */
export function lazyUi<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
) {
  return dynamic(loader, { ssr: false });
}
