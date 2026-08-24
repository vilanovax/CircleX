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
    <header className="sticky top-0 z-30">
      <div className="relative border-b border-stone-200/60 bg-[color:var(--circle-surface)] pt-[env(safe-area-inset-top,0px)] dark:border-zinc-800 dark:bg-zinc-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-full h-[50vh] bg-[color:var(--circle-surface)] dark:bg-zinc-900"
        />
        <div className="flex min-h-14 items-center gap-2 px-4">
          {back && (
            <button
              onClick={handleBack}
              aria-label="برگشت"
              className="inline-grid size-9 shrink-0 place-items-center appearance-none p-0 leading-none text-ink-muted dark:text-zinc-300 active:text-ink dark:active:text-zinc-100"
            >
              <BackIcon className="block h-6 w-6" />
            </button>
          )}
          <div className="flex min-h-9 min-w-0 flex-1 flex-col justify-center">
            {children ?? (
              <>
                <h1 className="m-0 font-extrabold text-ink dark:text-zinc-100 truncate leading-none text-[17px]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="m-0 mt-1 text-[11px] text-ink-muted dark:text-zinc-400 truncate leading-none">
                    {subtitle}
                  </p>
                ) : null}
              </>
            )}
          </div>
          {action ? (
            <div className="flex shrink-0 items-center">{action}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
