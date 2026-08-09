"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import CircleClassic from "./CircleClassic";

const CircleMantine = lazyUi(() => import("./CircleMantine"));

export default function CirclePage() {
  return <UISwitch classic={<CircleClassic />} mantine={<CircleMantine />} />;
}
