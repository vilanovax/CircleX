"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import NewClassic from "./NewClassic";

const NewMantine = lazyUi(() => import("./NewMantine"));

export default function NewPage() {
  return <UISwitch classic={<NewClassic />} mantine={<NewMantine />} />;
}
