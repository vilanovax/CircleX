"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import EventsClassic from "./EventsClassic";

const EventsMantine = lazyUi(() => import("./EventsMantine"));

export default function EventsPage() {
  return <UISwitch classic={<EventsClassic />} mantine={<EventsMantine />} />;
}
