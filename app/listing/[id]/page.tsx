"use client";

import { UISwitch } from "@/lib/ui-mode";
import { lazyUi } from "@/lib/lazy-ui";
import ListingClassic from "./ListingClassic";

const ListingMantine = lazyUi(() => import("./ListingMantine"));
const ListingChakra = lazyUi(() => import("./ListingChakra"));
const ListingMui = lazyUi(() => import("./ListingMui"));
const ListingHero = lazyUi(() => import("./ListingHero"));

export default function ListingPage(props: { params: { id: string } }) {
  return (
    <UISwitch
      classic={<ListingClassic {...props} />}
      mantine={<ListingMantine {...props} />}
      chakra={<ListingChakra {...props} />}
      mui={<ListingMui {...props} />}
      heroui={<ListingHero {...props} />}
    />
  );
}
