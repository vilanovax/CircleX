"use client";

import { UISwitch } from "@/lib/ui-mode";
import GraphClassic from "./GraphClassic";
import GraphMantine from "./GraphMantine";

export default function GraphPage() {
  return <UISwitch classic={<GraphClassic />} mantine={<GraphMantine />} />;
}
