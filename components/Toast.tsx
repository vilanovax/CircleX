"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

interface ToastItem {
  id: number;
  message: string;
}

const ToastContext = createContext<{ show: (message: string) => void } | null>(
  null,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const show = useCallback((message: string) => {
    const id = ++seq.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast layer, constrained to the phone column */}
      <div className="fixed top-0 inset-x-0 z-[60] pointer-events-none">
        <div className="app-shell !min-h-0 !shadow-none bg-transparent">
          <div className="flex flex-col items-center gap-2 pt-3 px-4">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="animate-toast-in bg-zinc-900/92 text-white text-sm font-medium rounded-full px-4 py-2.5 shadow-lg max-w-full"
              >
                {t.message}
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
