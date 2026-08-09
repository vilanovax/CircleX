"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import EventClassic from "./EventClassic";

const EventMantine = lazyUi(() => import("./EventMantine"));

export default function EventPage(props: { params: { id: string } }) {
  return (
    <UISwitch
      classic={<EventClassic {...props} />}
      mantine={<EventMantine {...props} />}
    />
  );
}
