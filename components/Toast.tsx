"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastOptions {
  action?: ToastAction;
  /** Dismiss after this many ms. Default 2400, or 4200 when an action is set. */
  ms?: number;
}

const ToastContext = createContext<{
  show: (message: string, opts?: ToastOptions) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, opts?: ToastOptions) => {
      const id = ++seq.current;
      setToasts((prev) => [...prev, { id, message, action: opts?.action }]);
      const ms = opts?.ms ?? (opts?.action ? 4200 : 2400);
      const handle = window.setTimeout(() => dismiss(id), ms);
      timers.current.set(id, handle);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-0 inset-x-0 z-[60] pointer-events-none"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="app-shell !min-h-0 !shadow-none bg-transparent">
          <div className="flex flex-col items-center gap-2 pt-3 px-4">
            {toasts.map((t) => (
              <div
                key={t.id}
                className={`animate-toast-in bg-zinc-900 text-white text-sm font-medium rounded-full px-4 py-2.5 shadow-lg max-w-full flex items-center gap-3 ${
                  t.action ? "pointer-events-auto" : ""
                }`}
              >
                <span className="min-w-0">{t.message}</span>
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="shrink-0 text-[13px] font-bold text-brand-300 dark:text-brand-700"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
