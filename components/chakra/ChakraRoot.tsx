"use client";

import { useEffect } from "react";
import { ChakraProvider, useColorMode } from "@chakra-ui/react";
import { useTheme } from "@/lib/theme";
import { chakraTheme } from "@/lib/chakra-theme";

/** Keeps Chakra's color mode in lock-step with the app's ThemeProvider. */
function ColorModeSync({ resolved }: { resolved: "light" | "dark" }) {
  const { colorMode, setColorMode } = useColorMode();
  useEffect(() => {
    if (colorMode !== resolved) setColorMode(resolved);
  }, [resolved, colorMode, setColorMode]);
  return null;
}

/**
 * Wraps the app in Chakra's provider. `resetCSS={false}` and an empty global
 * style block keep Chakra from touching the <body>, so the classic (Tailwind)
 * and Mantine UIs are unaffected — only Chakra components opt into its styles.
 */
export default function ChakraRoot({ children }: { children: React.ReactNode }) {
  const { resolved } = useTheme();
  return (
    <ChakraProvider theme={chakraTheme} resetCSS={false}>
      <ColorModeSync resolved={resolved} />
      {children}
    </ChakraProvider>
  );
}
