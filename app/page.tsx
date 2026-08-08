"use client";

import { UISwitch } from "@/lib/ui-mode";
import ClassicFeed from "./ClassicFeed";
import MantineFeed from "./MantineFeed";
import ChakraFeed from "./ChakraFeed";
import MuiFeed from "./MuiFeed";
import HeroFeed from "./HeroFeed";

export default function FeedPage() {
  return (
    <UISwitch
      classic={<ClassicFeed />}
      mantine={<MantineFeed />}
      chakra={<ChakraFeed />}
      mui={<MuiFeed />}
      heroui={<HeroFeed />}
    />
  );
}
