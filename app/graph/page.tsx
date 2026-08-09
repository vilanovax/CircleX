"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import GraphClassic from "./GraphClassic";

const GraphMantine = lazyUi(() => import("./GraphMantine"));

export default function GraphPage() {
  return <UISwitch classic={<GraphClassic />} mantine={<GraphMantine />} />;
}
