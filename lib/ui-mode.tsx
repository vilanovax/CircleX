"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUILibReady } from "@/lib/ui-lib-ready";

/** Which UI library renders the screens. */
export type UIMode = "classic" | "mantine" | "chakra" | "mui" | "heroui";

const UI_MODES: readonly UIMode[] = ["classic", "mantine", "chakra", "mui", "heroui"];

const STORAGE_KEY = "circle-ui-mode";

interface UIModeValue {
  mode: UIMode;
  setMode: (m: UIMode) => void;
  /** True once the client has read the persisted preference (post-hydration). */
  mounted: boolean;
}

const UIModeContext = createContext<UIModeValue | null>(null);

/**
 * Inline script (runs before paint) that mirrors the saved UI mode onto
 * <html data-ui="…">. Useful for any pure-CSS adjustments; the React tree
 * itself still swaps after hydration to stay SSR-consistent.
 */
export const uiModeScript = `(function(){try{var m=localStorage.getItem('${STORAGE_KEY}')||'classic';document.documentElement.setAttribute('data-ui',m);}catch(e){}})();`;

export function UIModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<UIMode>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: UIMode = "classic";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && (UI_MODES as readonly string[]).includes(raw)) saved = raw as UIMode;
    } catch {
      // ignore
    }
    setModeState(saved);
    setMounted(true);
  }, []);

  const setMode = useCallback((m: UIMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore quota errors
    }
    document.documentElement.setAttribute("data-ui", m);
  }, []);

  const value = useMemo<UIModeValue>(
    () => ({ mode, setMode, mounted }),
    [mode, setMode, mounted],
  );

  return (
    <UIModeContext.Provider value={value}>{children}</UIModeContext.Provider>
  );
}

export function useUIMode() {
  const ctx = useContext(UIModeContext);
  if (!ctx) throw new Error("useUIMode must be used within UIModeProvider");
  return ctx;
}

/**
 * Renders the classic (Tailwind) tree by default and swaps to the Mantine or
 * Chakra tree once the persisted preference is read on the client. Rendering
 * classic during SSR + first paint keeps hydration consistent; the swap is a
 * single frame and only affects users who opted into another variant.
 *
 * Variants are optional per route: a page that has no `chakra` (or `mantine`)
 * variant falls back to `classic` when that mode is selected.
 */
export function UISwitch({
  classic,
  mantine,
  chakra,
  mui,
  heroui,
}: {
  classic: React.ReactNode;
  mantine?: React.ReactNode;
  chakra?: React.ReactNode;
  mui?: React.ReactNode;
  heroui?: React.ReactNode;
}) {
  const { mode, mounted } = useUIMode();
  const libReady = useUILibReady();
  // Stay on classic until the matching library provider chunk is ready so
  // variant trees never render without their Theme/Provider.
  if (!mounted || !libReady) return <>{classic}</>;
  if (mode === "mantine" && mantine) return <>{mantine}</>;
  if (mode === "chakra" && chakra) return <>{chakra}</>;
  if (mode === "mui" && mui) return <>{mui}</>;
  if (mode === "heroui" && heroui) return <>{heroui}</>;
  return <>{classic}</>;
}
