"use client";

import { UISwitch } from "@/lib/ui-mode";
import SavedClassic from "./SavedClassic";
import SavedMantine from "./SavedMantine";

export default function SavedPage() {
  return <UISwitch classic={<SavedClassic />} mantine={<SavedMantine />} />;
}
