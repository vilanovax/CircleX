"use client";

import { useMemo } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import { ThemeProvider } from "@mui/material/styles";
import { useTheme } from "@/lib/theme";
import { buildMuiTheme } from "@/lib/mui-theme";

// Dedicated RTL Emotion cache keyed "muirtl" so MUI's styles are flipped for
// Persian and stay isolated from Chakra's Emotion cache (different key).
const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

/**
 * Wraps the app in MUI's providers. No CssBaseline — MUI must not restyle the
 * global <body>, so the classic / Mantine / Chakra UIs are unaffected; only
 * MUI components opt into its theme. Palette mode follows the app ThemeProvider.
 */
export default function MuiRoot({ children }: { children: React.ReactNode }) {
  const { resolved } = useTheme();
  const theme = useMemo(() => buildMuiTheme(resolved), [resolved]);
  return (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
