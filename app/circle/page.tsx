"use client";
import { UISwitch } from "@/lib/ui-mode";
import CircleClassic from "./CircleClassic";
import CircleMantine from "./CircleMantine";
export default function CirclePage() {
  return <UISwitch classic={<CircleClassic />} mantine={<CircleMantine />} />;
}
