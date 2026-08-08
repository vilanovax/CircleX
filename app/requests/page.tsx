"use client";

import { UISwitch } from "@/lib/ui-mode";
import RequestsClassic from "./RequestsClassic";
import RequestsMantine from "./RequestsMantine";

export default function RequestsPage() {
  return <UISwitch classic={<RequestsClassic />} mantine={<RequestsMantine />} />;
}
