"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import SavedClassic from "./SavedClassic";

const SavedMantine = lazyUi(() => import("./SavedMantine"));

export default function SavedPage() {
  return <UISwitch classic={<SavedClassic />} mantine={<SavedMantine />} />;
}
