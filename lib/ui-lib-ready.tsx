"use client";

import { createContext, useContext } from "react";

/** True when the active UI library provider (if any) is mounted and ready. */
export const UILibReadyContext = createContext(true);

export function useUILibReady() {
  return useContext(UILibReadyContext);
}
