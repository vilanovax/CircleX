"use client";

import "@mantine/core/styles.layer.css";
import { DirectionProvider, MantineProvider } from "@mantine/core";
import { useTheme } from "@/lib/theme";
import { mantineTheme } from "@/lib/mantine-theme";

/**
 * Wraps the app in Mantine's providers. Color scheme is driven by the app's
 * own ThemeProvider (so the existing light/dark/system toggle keeps working in
 * both UI modes), and direction is forced RTL to match the Persian layout.
 */
export default function MantineRoot({ children }: { children: React.ReactNode }) {
  const { resolved } = useTheme();
  return (
    <DirectionProvider initialDirection="rtl">
      <MantineProvider theme={mantineTheme} forceColorScheme={resolved}>
        {children}
      </MantineProvider>
    </DirectionProvider>
  );
}
