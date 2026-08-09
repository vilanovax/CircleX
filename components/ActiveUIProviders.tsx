"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useUIMode, type UIMode } from "@/lib/ui-mode";
import { UILibReadyContext } from "@/lib/ui-lib-ready";

type RootComponent = ComponentType<{ children: ReactNode }>;

const loaders: Record<
  Exclude<UIMode, "classic">,
  () => Promise<{ default: RootComponent }>
> = {
  mantine: () => import("@/components/mantine/MantineRoot"),
  chakra: () => import("@/components/chakra/ChakraRoot"),
  mui: () => import("@/components/mui/MuiRoot"),
  heroui: () => import("@/components/heroui/HeroUIRoot"),
};

/**
 * Mounts only the provider stack for the active UI mode.
 * Classic needs no extra root — Mantine/Chakra/MUI/HeroUI stay out of the
 * initial bundle until the user actually switches to that mode.
 */
export default function ActiveUIProviders({ children }: { children: ReactNode }) {
  const { mode, mounted } = useUIMode();
  const target: UIMode = mounted ? mode : "classic";
  const [Root, setRoot] = useState<RootComponent | null>(null);
  const [readyFor, setReadyFor] = useState<UIMode>("classic");

  useEffect(() => {
    let cancelled = false;

    if (target === "classic") {
      setRoot(null);
      setReadyFor("classic");
      return () => {
        cancelled = true;
      };
    }

    const load = loaders[target];
    setReadyFor("classic"); // keep classic until chunk is ready
    load().then((mod) => {
      if (cancelled) return;
      setRoot(() => mod.default);
      setReadyFor(target);
    });

    return () => {
      cancelled = true;
    };
  }, [target]);

  const libReady = target === "classic" || readyFor === target;
  const tree =
    Root && readyFor === target && target !== "classic" ? (
      <Root>{children}</Root>
    ) : (
      children
    );

  return (
    <UILibReadyContext.Provider value={libReady}>{tree}</UILibReadyContext.Provider>
  );
}
