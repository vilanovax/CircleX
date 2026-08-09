"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import ClassicFeed from "./ClassicFeed";

const MantineFeed = lazyUi(() => import("./MantineFeed"));
const ChakraFeed = lazyUi(() => import("./ChakraFeed"));
const MuiFeed = lazyUi(() => import("./MuiFeed"));
const HeroFeed = lazyUi(() => import("./HeroFeed"));

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
