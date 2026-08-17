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
    <header className="sticky top-0 z-30 isolate pt-[env(safe-area-inset-top,0px)]">
      {/* Blur on a sibling layer so Safari doesn't clip header actions */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[color:var(--circle-surface)]/92 dark:bg-zinc-900/90 backdrop-blur-xl border-b border-stone-200/60 dark:border-zinc-800"
      />
      <div className="relative flex min-h-14 items-center gap-2 px-4 py-2">
        {back && (
          <button
            onClick={handleBack}
            aria-label="برگشت"
            className="-mr-2 inline-grid size-9 shrink-0 place-items-center appearance-none p-0 leading-none text-ink-muted dark:text-zinc-300 active:text-ink dark:active:text-zinc-100"
          >
            <BackIcon className="w-6 h-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {children ?? (
            <>
              <h1 className="font-extrabold text-ink dark:text-zinc-100 truncate leading-tight text-[17px]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-ink-muted dark:text-zinc-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        {action ? (
          <div className="flex shrink-0 items-center self-center">{action}</div>
        ) : null}
      </div>
    </header>
  );
}
