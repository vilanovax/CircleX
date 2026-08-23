"use client";

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ArchiveIcon, PinIcon, TrashIcon } from "@/components/Icons";

const ACTION_W = 68;
const PANEL_W = ACTION_W * 3;
const OPEN_THRESHOLD = 56;
const LOCK_PX = 14;

type Props = {
  children: ReactNode;
  archived: boolean;
  pinned: boolean;
  disabled?: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
};

/**
 * Optional swipe-left actions. Taps must still open the thread —
 * capture/preventDefault only after a clear horizontal swipe.
 */
export default function SwipeThreadRow({
  children,
  archived,
  pinned,
  disabled = false,
  onArchive,
  onUnarchive,
  onDelete,
  onTogglePin,
}: Props) {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const locking = useRef<"h" | "v" | null>(null);
  const tracking = useRef(false);
  const didSwipe = useRef(false);

  const setOff = useCallback((v: number) => {
    const clamped = Math.max(-PANEL_W, Math.min(0, v));
    offsetRef.current = clamped;
    setOffset(clamped);
  }, []);

  function onPointerDown(e: ReactPointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    tracking.current = true;
    didSwipe.current = false;
    locking.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = offsetRef.current;
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!tracking.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!locking.current) {
      if (Math.hypot(dx, dy) < LOCK_PX) return;
      locking.current = Math.abs(dx) > Math.abs(dy) * 1.15 ? "h" : "v";
      if (locking.current === "h") {
        didSwipe.current = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    }
    if (locking.current !== "h") return;
    setOff(startOffset.current + dx);
  }

  function onPointerUp() {
    if (!tracking.current) return;
    tracking.current = false;
    if (locking.current !== "h") {
      locking.current = null;
      return;
    }
    locking.current = null;
    setOff(offsetRef.current < -OPEN_THRESHOLD ? -PANEL_W : 0);
  }

  function run(action: () => void) {
    setOff(0);
    action();
  }

  const open = offset < -OPEN_THRESHOLD / 2;

  if (disabled) return <>{children}</>;

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: PANEL_W }}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => run(onTogglePin)}
          className={`flex flex-col items-center justify-center gap-0.5 text-white text-[10px] font-bold ${
            pinned ? "bg-amber-600" : "bg-stone-500"
          }`}
          style={{ width: ACTION_W }}
        >
          <PinIcon className="w-4 h-4" />
          {pinned ? "برداشتن" : "سنجاق"}
        </button>
        <button
          type="button"
          onClick={() => run(archived ? onUnarchive : onArchive)}
          className="flex flex-col items-center justify-center gap-0.5 bg-brand-600 text-white text-[10px] font-bold"
          style={{ width: ACTION_W }}
        >
          <ArchiveIcon className="w-4 h-4" />
          {archived ? "برگرداندن" : "آرشیو"}
        </button>
        <button
          type="button"
          onClick={() => run(onDelete)}
          className="flex flex-col items-center justify-center gap-0.5 bg-red-600 text-white text-[10px] font-bold"
          style={{ width: ACTION_W }}
        >
          <TrashIcon className="w-4 h-4" />
          حذف
        </button>
      </div>

      <div
        className="relative bg-[color:var(--circle-surface)] dark:bg-zinc-900"
        style={{
          transform: `translateX(${offset}px)`,
          transition: tracking.current && locking.current === "h" ? "none" : "transform 160ms ease-out",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (!didSwipe.current && Math.abs(offsetRef.current) < 8) return;
          e.preventDefault();
          e.stopPropagation();
          didSwipe.current = false;
          if (offsetRef.current > -OPEN_THRESHOLD) setOff(0);
        }}
      >
        {children}
      </div>
    </div>
  );
}
