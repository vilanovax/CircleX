"use client";

import { useTheme, type Theme } from "@/lib/theme";
import { MonitorIcon, MoonIcon, SunIcon } from "./Icons";

const OPTIONS: { key: Theme; label: string; Icon: typeof SunIcon }[] = [
  { key: "light", label: "روشن", Icon: SunIcon },
  { key: "dark", label: "تیره", Icon: MoonIcon },
  { key: "system", label: "سیستم", Icon: MonitorIcon },
];

/** Three-state segmented control (light / dark / system). */
export function ThemeSegmented({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className={`flex gap-1 bg-stone-100 dark:bg-zinc-800 rounded-xl ${
        compact ? "p-1" : "p-1.5 rounded-2xl gap-1.5"
      }`}
    >
      {OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          aria-pressed={theme === key}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-bold transition-colors ${
            compact ? "py-2" : "flex-col py-3 rounded-xl text-[13px] gap-1"
          } ${
            theme === key
              ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
              : "text-ink-muted dark:text-zinc-300 active:bg-stone-200/70 dark:active:bg-zinc-700/60"
          }`}
        >
          <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
          {label}
        </button>
      ))}
    </div>
  );
}
