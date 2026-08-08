"use client";
import { UISwitch } from "@/lib/ui-mode";
import EventClassic from "./EventClassic";
import EventMantine from "./EventMantine";
export default function EventPage(props: { params: { id: string } }) {
  return <UISwitch classic={<EventClassic {...props} />} mantine={<EventMantine {...props} />} />;
}
