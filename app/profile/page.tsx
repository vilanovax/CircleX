"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import ClassicProfile from "./ClassicProfile";

const MantineProfile = lazyUi(() => import("./MantineProfile"));

export default function ProfilePage() {
  return <UISwitch classic={<ClassicProfile />} mantine={<MantineProfile />} />;
}
