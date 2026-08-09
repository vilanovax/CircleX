"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import PersonClassic from "./PersonClassic";

const PersonMantine = lazyUi(() => import("./PersonMantine"));

export default function PersonPage(props: { params: { id: string } }) {
  return (
    <UISwitch
      classic={<PersonClassic {...props} />}
      mantine={<PersonMantine {...props} />}
    />
  );
}
