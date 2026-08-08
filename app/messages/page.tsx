"use client";

import { UISwitch } from "@/lib/ui-mode";
import MessagesClassic from "./MessagesClassic";
import MessagesMantine from "./MessagesMantine";

export default function MessagesPage() {
  return <UISwitch classic={<MessagesClassic />} mantine={<MessagesMantine />} />;
}
