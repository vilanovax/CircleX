"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import ThreadClassic from "./ThreadClassic";

const ThreadMantine = lazyUi(() => import("./ThreadMantine"));

export default function ThreadPage(props: { params: { id: string } }) {
  return (
    <UISwitch
      classic={<ThreadClassic {...props} />}
      mantine={<ThreadMantine {...props} />}
    />
  );
}
