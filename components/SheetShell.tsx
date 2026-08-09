"use client";

import { useRef, type ReactNode } from "react";
import { useSheetA11y } from "@/lib/use-sheet-a11y";

/**
 * Shared bottom-sheet chrome for Classic UI — overlay, handle, surface, safe-area.
 */
export default function SheetShell({
  onClose,
  labelledBy,
  children,
  maxHeight = "90dvh",
  zClass = "z-40",
  onEscape,
}: {
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  maxHeight?: string;
  zClass?: string;
  onEscape?: () => boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose, onEscape ? { onEscape } : undefined);

  return (
    <div className={`fixed inset-0 ${zClass} flex justify-center`}>
      <div className="relative w-full max-w-[480px]">
        <div
          className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          style={{ maxHeight }}
          className="absolute bottom-0 inset-x-0 bg-[color:var(--circle-surface)] dark:bg-zinc-900 rounded-t-[1.35rem] px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] animate-slide-up overflow-y-auto outline-none shadow-[0_-8px_40px_rgba(26,24,22,0.12)] flex flex-col"
        >
          <div className="w-9 h-1 bg-stone-300/80 dark:bg-zinc-600 rounded-full mx-auto mb-4 shrink-0" />
          {children}
        </div>
      </div>
    </div>
  );
}
