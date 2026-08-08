"use client";
import { UISwitch } from "@/lib/ui-mode";
import ListingClassic from "./ListingClassic";
import ListingMantine from "./ListingMantine";
import ListingChakra from "./ListingChakra";
import ListingMui from "./ListingMui";
import ListingHero from "./ListingHero";
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
