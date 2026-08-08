"use client";

import { HeroUIProvider } from "@heroui/react";

/**
 * Provides HeroUI context. RTL comes from `locale="fa-IR"` (react-aria reads
 * the direction from the locale); dark mode is driven by the existing `.dark`
 * class on <html> that the app's ThemeProvider already toggles, so no extra
 * color-mode bridge is needed.
 */
export default function HeroUIRoot({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider locale="fa-IR">{children}</HeroUIProvider>;
}
