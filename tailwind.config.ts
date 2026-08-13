import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazir)", "Vazirmatn", "system-ui", "sans-serif"],
      },
      colors: {
        // Circle brand — deep indigo-plum (action only; not body text)
        brand: {
          50: "#f3f1fa",
          100: "#e6e1f5",
          200: "#cdc4eb",
          300: "#a89ad6",
          400: "#7f6bc0",
          500: "#5f4aa8",
          600: "#4a3a8f",
          700: "#3c3075",
          800: "#2f275c",
          900: "#221d45",
        },
        // Warm stone surfaces — intimate, not cool gray marketplace
        canvas: {
          DEFAULT: "#ebe8e3",
          dark: "#121110",
        },
        ink: {
          DEFAULT: "#1a1816",
          muted: "#6b6560",
          // ≥4.5:1 on warm canvas / card surfaces (#fffcf8 / #ebe8e3)
          faint: "#6f6a64",
        },
        // Trust level colors
        levelA: "#1f6b42", // green — closest; ≥4.5:1 on card cream
        levelB: "#3b6ea5", // steel blue
        levelC: "#c27a2d", // clay amber
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,24,22,0.04), 0 4px 16px rgba(26,24,22,0.05)",
        nav: "0 -1px 16px rgba(26,24,22,0.06)",
      },
      borderRadius: {
        "2xl": "1.125rem",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "toast-in": {
          "0%": { transform: "translateY(-16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        appear: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.25s ease-out",
        "fade-up": "fade-up 0.35s ease-out both",
        "toast-in": "toast-in 0.25s ease-out",
        appear: "appear 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
