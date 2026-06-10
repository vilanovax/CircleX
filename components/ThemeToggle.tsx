"use client";

import { useTheme, type Theme } from "@/lib/theme";
import { MonitorIcon, MoonIcon, SunIcon } from "./Icons";

const OPTIONS: { key: Theme; label: string; Icon: typeof SunIcon }[] = [
  { key: "light", label: "روشن", Icon: SunIcon },
  { key: "dark", label: "تیره", Icon: MoonIcon },
  { key: "system", label: "سیستم", Icon: MonitorIcon },
];

/** Three-state segmented control (light / dark / system). */
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
      {OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          aria-pressed={theme === key}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            theme === key
              ? "bg-white dark:!bg-zinc-700 text-brand-700 dark:text-brand-300 shadow-sm"
              : "text-zinc-500"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

/** Compact icon button that flips between light and dark. */
export function ThemeButton() {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "روشن کردن تم" : "تیره کردن تم"}
      className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-300 active:bg-zinc-100 dark:active:bg-zinc-800"
    >
      {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
  );
}
