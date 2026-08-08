"use client";
import { UISwitch } from "@/lib/ui-mode";
import RequestClassic from "./RequestClassic";
import RequestMantine from "./RequestMantine";
export default function RequestPage(props: { params: { id: string } }) {
  return <UISwitch classic={<RequestClassic {...props} />} mantine={<RequestMantine {...props} />} />;
}
