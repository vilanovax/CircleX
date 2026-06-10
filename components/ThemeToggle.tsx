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
    <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1.5">
      {OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          aria-pressed={theme === key}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-[13px] font-bold transition-colors ${
            theme === key
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
              : "text-zinc-500 dark:text-zinc-300 active:bg-zinc-200/60 dark:active:bg-zinc-700/60"
          }`}
        >
          <Icon className="w-5 h-5" />
          {label}
        </button>
      ))}
    </div>
  );
}
