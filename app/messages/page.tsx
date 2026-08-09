"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import MessagesClassic from "./MessagesClassic";

const MessagesMantine = lazyUi(() => import("./MessagesMantine"));

export default function MessagesPage() {
  return (
    <UISwitch classic={<MessagesClassic />} mantine={<MessagesMantine />} />
  );
}
