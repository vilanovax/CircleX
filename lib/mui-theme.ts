import { createTheme, type Theme } from "@mui/material/styles";

const FONT = "var(--font-vazir), Vazirmatn, system-ui, sans-serif";

/** Build an RTL MUI theme in the given palette mode, tuned to the Circle brand. */
export function buildMuiTheme(mode: "light" | "dark"): Theme {
  return createTheme({
    direction: "rtl",
    palette: {
      mode,
      primary: {
        main: "#7c3aed", // brand-600
        light: "#a78bfa",
        dark: "#6d28d9",
        contrastText: "#fff",
      },
      success: { main: "#16a34a" },
      ...(mode === "dark"
        ? { background: { default: "#0a0a0c", paper: "#18181b" } }
        : { background: { default: "#f4f4f7", paper: "#ffffff" } }),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: FONT,
      button: { fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 12 } } },
      MuiCard: { defaultProps: { variant: "outlined" }, styleOverrides: { root: { borderRadius: 16 } } },
      MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    },
  });
}
