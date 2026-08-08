"use client";

import { Box, Center } from "@chakra-ui/react";
import { isListingPhoto } from "@/lib/listing-image";

const SIZES = {
  sm: { box: "64px", fz: "30px" },
  md: { box: "80px", fz: "36px" },
  lg: { box: "48px", fz: "24px" },
  hero: { box: "100%", fz: "64px", h: "176px" },
} as const;

/** Chakra variant of ListingImage: emoji placeholder on a soft tint, or photo. */
export default function CListingImage({
  image,
  alt = "",
  size = "md",
}: {
  image: string;
  alt?: string;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  const isHero = size === "hero";
  const w = isHero ? "100%" : s.box;
  const h = isHero ? (s as { h: string }).h : s.box;

  if (isListingPhoto(image)) {
    return (
      <Box w={w} h={h} rounded={isHero ? "2xl" : "xl"} overflow="hidden" flexShrink={0}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>
    );
  }

  return (
    <Center
      w={w}
      h={h}
      rounded={isHero ? "2xl" : "xl"}
      flexShrink={0}
      fontSize={s.fz}
      bgGradient="linear(to-br, brand.50, blackAlpha.50)"
      _dark={{ bgGradient: "linear(to-br, whiteAlpha.100, whiteAlpha.50)" }}
      aria-hidden={!alt}
    >
      {image}
    </Center>
  );
}
