"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import RequestsClassic from "./RequestsClassic";

const RequestsMantine = lazyUi(() => import("./RequestsMantine"));

export default function RequestsPage() {
  return (
    <UISwitch classic={<RequestsClassic />} mantine={<RequestsMantine />} />
  );
}
