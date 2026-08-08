"use client";

import { UISwitch } from "@/lib/ui-mode";
import EventsClassic from "./EventsClassic";
import EventsMantine from "./EventsMantine";

export default function EventsPage() {
  return <UISwitch classic={<EventsClassic />} mantine={<EventsMantine />} />;
}
