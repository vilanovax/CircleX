"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import RequestClassic from "./RequestClassic";

const RequestMantine = lazyUi(() => import("./RequestMantine"));

export default function RequestPage(props: { params: { id: string } }) {
  return (
    <UISwitch
      classic={<RequestClassic {...props} />}
      mantine={<RequestMantine {...props} />}
    />
  );
}
