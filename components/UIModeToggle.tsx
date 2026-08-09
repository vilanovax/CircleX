"use client";

import { useRouter } from "next/navigation";
import { useUIMode, type UIMode } from "@/lib/ui-mode";
import { useToast } from "@/components/Toast";

const OPTIONS: { key: UIMode; label: string; hint: string }[] = [
  { key: "classic", label: "کلاسیک", hint: "Tailwind" },
  { key: "mantine", label: "مدرن", hint: "Mantine" },
  { key: "chakra", label: "چاکرا", hint: "Chakra" },
  { key: "mui", label: "متریال", hint: "MUI" },
  { key: "heroui", label: "هیرو", hint: "HeroUI" },
];

/** Modes that only re-skin the home + listing pages (others fall back to classic). */
const PARTIAL: UIMode[] = ["chakra", "mui", "heroui"];

/** Tailwind-styled segmented control to switch the app's display model. */
export function UIModeSegmented() {
  const { mode, setMode } = useUIMode();
  const router = useRouter();
  const { show } = useToast();

  function pick(key: UIMode, label: string) {
    setMode(key);
    // Always jump to the home feed: it renders in every library, so the change
    // is immediately visible (the profile page itself only has classic/Mantine).
    router.push("/");
    show(
      key === "classic"
        ? "نمای کلاسیک فعال شد"
        : PARTIAL.includes(key)
          ? `نمای ${label} — صفحه‌ی اصلی و آگهی`
          : `نمای ${label} روی همه‌ی صفحات فعال شد`,
    );
  }

  return (
    <div>
      <div className="flex gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1.5">
        {OPTIONS.map(({ key, label, hint }) => (
          <button
            key={key}
            onClick={() => pick(key, label)}
            aria-pressed={mode === key}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl text-[13px] font-bold transition-colors ${
              mode === key
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                : "text-zinc-500 dark:text-zinc-300 active:bg-zinc-200/60 dark:active:bg-zinc-700/60"
            }`}
          >
            {label}
            <span
              className={`text-[10px] font-medium ${
                mode === key ? "text-brand-100" : "text-zinc-400"
              }`}
            >
              {hint}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
        Mantine همه‌جا؛ Chakra / MUI / HeroUI فقط خانه و آگهی. با انتخاب به خانه
        می‌روی تا تغییر را ببینی.
      </p>
    </div>
  );
}
