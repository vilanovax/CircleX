import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

// Circle brand violet mapped to Chakra's 50–900 scale (500 = #8b5cf6,
// 600 = #7c3aed matches the Tailwind brand-600 primary accent).
const brand = {
  50: "#f5f3ff",
  100: "#ede9fe",
  200: "#ddd6fe",
  300: "#c4b5fd",
  400: "#a78bfa",
  500: "#8b5cf6",
  600: "#7c3aed",
  700: "#6d28d9",
  800: "#5b21b6",
  900: "#4c1d95",
};

/** Chakra theme tuned to match the Circle (سیرکل) visual language. RTL. */
export const chakraTheme = extendTheme({
  config,
  direction: "rtl",
  fonts: {
    heading: "var(--font-vazir), Vazirmatn, system-ui, sans-serif",
    body: "var(--font-vazir), Vazirmatn, system-ui, sans-serif",
  },
  colors: { brand },
  // Keep Chakra from styling the global <body>; the classic/Mantine UIs own it.
  styles: { global: {} },
});
