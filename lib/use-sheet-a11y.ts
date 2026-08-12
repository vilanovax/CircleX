"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Focus trap + Escape for bottom sheets / modals.
 * Attach `panelRef` to the element with role="dialog".
 */
export function useSheetA11y(
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  options?: {
    /** Return true when handled; false runs onClose. */
    onEscape?: () => boolean;
    /** When false, trap is inactive (e.g. conditionally mounted sheet). */
    enabled?: boolean;
    /** When false, caller owns initial focus (step changes, custom CTA). */
    autoFocus?: boolean;
  },
) {
  const onEscape = options?.onEscape;
  const enabled = options?.enabled ?? true;
  const autoFocus = options?.autoFocus ?? true;

  useEffect(() => {
    if (!enabled) return;
    const current = panelRef.current;
    if (!current) return;
    const panel: HTMLElement = current;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusFrame = autoFocus
      ? requestAnimationFrame(() => {
          const items = getFocusables(panel);
          (items[0] ?? panel).focus();
        })
      : null;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (onEscape?.()) return;
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = getFocusables(panel);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      if (focusFrame != null) cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [autoFocus, enabled, onClose, onEscape, panelRef]);
}
