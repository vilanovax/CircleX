"use client";

import { useRouter } from "next/navigation";
import { BackIcon } from "./Icons";

export default function Header({
  title,
  subtitle,
  back = false,
  fallbackHref = "/",
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  /** Where to go if there's no in-app history to go back to. */
  fallbackHref?: string;
  action?: React.ReactNode;
  /** Custom title content; replaces title/subtitle when provided. */
  children?: React.ReactNode;
}) {
  const router = useRouter();

  function handleBack() {
    // Avoid leaving the app when the page was opened directly via a link.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-2 px-4 h-14">
        {back && (
          <button
            onClick={handleBack}
            aria-label="بازگشت"
            className="-mr-2 w-9 h-9 flex items-center justify-center text-zinc-600 dark:text-zinc-300 active:text-zinc-900 dark:active:text-zinc-100"
          >
            <BackIcon className="w-6 h-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {children ?? (
            <>
              <h1 className="font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
