"use client";
import { UISwitch } from "@/lib/ui-mode";
import PersonClassic from "./PersonClassic";
import PersonMantine from "./PersonMantine";
export default function PersonPage(props: { params: { id: string } }) {
  return <UISwitch classic={<PersonClassic {...props} />} mantine={<PersonMantine {...props} />} />;
}
