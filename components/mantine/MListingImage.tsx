"use client";

import { Box } from "@mantine/core";
import { isListingPhoto } from "@/lib/listing-image";

const SIZES = {
  sm: { box: 64, fz: 30, radius: 12 },
  md: { box: 80, fz: 36, radius: 12 },
  lg: { box: 48, fz: 24, radius: 12 },
  hero: { box: "100%", fz: 64, radius: 16, height: 176 },
} as const;

/** Mantine variant of ListingImage: emoji placeholder on a soft tint, or photo. */
export default function MListingImage({
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
  const width = isHero ? "100%" : s.box;
  const height = isHero ? (s as { height: number }).height : s.box;

  const frame = {
    width,
    height,
    borderRadius: s.radius,
    flexShrink: 0,
    overflow: "hidden" as const,
  };

  if (isListingPhoto(image)) {
    return (
      <Box style={frame}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>
    );
  }

  return (
    <Box
      aria-hidden={!alt}
      style={{
        ...frame,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: s.fz,
        background:
          "linear-gradient(135deg, var(--mantine-color-brand-0), var(--mantine-color-default-hover))",
      }}
    >
      {image}
    </Box>
  );
}
