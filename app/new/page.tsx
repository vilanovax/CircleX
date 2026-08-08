"use client";

import { UISwitch } from "@/lib/ui-mode";
import NewClassic from "./NewClassic";
import NewMantine from "./NewMantine";

export default function NewPage() {
  return <UISwitch classic={<NewClassic />} mantine={<NewMantine />} />;
}
