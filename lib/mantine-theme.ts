import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Circle brand violet mapped to Mantine's 10-shade scale. Index 6 (#7c3aed)
// matches the Tailwind `brand-600` used as the primary accent across the app.
const brand: MantineColorsTuple = [
  "#f5f3ff",
  "#ede9fe",
  "#ddd6fe",
  "#c4b5fd",
  "#a78bfa",
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#4c1d95",
];

/** Mantine theme tuned to match the Circle (سیرکل) visual language. */
export const mantineTheme = createTheme({
  fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif",
  fontFamilyMonospace: "var(--font-vazir), Vazirmatn, monospace",
  headings: { fontFamily: "var(--font-vazir), Vazirmatn, system-ui, sans-serif" },
  primaryColor: "brand",
  primaryShade: 6,
  defaultRadius: "lg",
  colors: { brand },
  components: {
    Card: { defaultProps: { radius: "lg", withBorder: false } },
    Button: { defaultProps: { radius: "md" } },
    Paper: { defaultProps: { radius: "lg" } },
  },
});
