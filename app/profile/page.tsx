"use client";

import { UISwitch } from "@/lib/ui-mode";
import ClassicProfile from "./ClassicProfile";
import MantineProfile from "./MantineProfile";

export default function ProfilePage() {
  return <UISwitch classic={<ClassicProfile />} mantine={<MantineProfile />} />;
}
