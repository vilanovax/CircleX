"use client";
import { UISwitch } from "@/lib/ui-mode";
import ThreadClassic from "./ThreadClassic";
import ThreadMantine from "./ThreadMantine";
export default function ThreadPage(props: { params: { id: string } }) {
  return <UISwitch classic={<ThreadClassic {...props} />} mantine={<ThreadMantine {...props} />} />;
}
