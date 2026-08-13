"use client";

import { useRef, type ReactNode } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";

/**
 * Shared bottom-sheet chrome for Classic UI — overlay, handle, surface, safe-area.
 * Optional `footer` stays pinned while `children` scroll.
 */
export default function SheetShell({
  onClose,
  labelledBy,
  children,
  footer,
  maxHeight = "90dvh",
  zClass = "z-40",
  onEscape,
  closeOnBackdrop = true,
  backdropClassName,
  autoFocus = true,
}: {
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: string;
  zClass?: string;
  onEscape?: () => boolean;
  /** When false, backdrop clicks do nothing (Escape still uses onEscape/onClose). */
  closeOnBackdrop?: boolean;
  backdropClassName?: string;
  /** When false, caller manages initial focus (e.g. step titles). */
  autoFocus?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose, { onEscape, autoFocus });

  return (
    <div className={`fixed inset-0 ${zClass} flex justify-center`}>
      <div className="relative w-full max-w-[480px]">
        <div
          className={`absolute inset-0 ${
            backdropClassName ?? "bg-ink/35 backdrop-blur-[2px]"
          }`}
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          style={{ maxHeight }}
          className="absolute bottom-0 inset-x-0 bg-[color:var(--circle-surface)] dark:bg-zinc-900 rounded-t-[1.35rem] pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-slide-up overflow-hidden outline-none shadow-[0_-8px_40px_rgba(26,24,22,0.12)] flex flex-col"
        >
          <div className="w-9 h-1 bg-stone-300/80 dark:bg-zinc-600 rounded-full mx-auto mb-3 shrink-0" />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
            {children}
          </div>
          {footer && (
            <div className="shrink-0 px-4 pt-2.5 border-t border-stone-200/70 dark:border-zinc-800 bg-[color:var(--circle-surface)] dark:bg-zinc-900">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
