"use client";

import { Box } from "@mui/material";
import { isListingPhoto } from "@/lib/listing-image";

const SIZES = {
  sm: { box: 64, fz: 30 },
  md: { box: 80, fz: 36 },
  lg: { box: 48, fz: 24 },
  hero: { box: "100%", fz: 64, h: 176 },
} as const;

/** MUI variant of ListingImage: emoji placeholder on a soft tint, or photo. */
export default function MuiListingImage({
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
  const h = isHero ? (s as { h: number }).h : s.box;

  if (isListingPhoto(image)) {
    return (
      <Box sx={{ width: w, height: h, borderRadius: isHero ? 3 : 2, overflow: "hidden", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </Box>
    );
  }

  return (
    <Box
      aria-hidden={!alt}
      sx={{
        width: w,
        height: h,
        borderRadius: isHero ? 3 : 2,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: s.fz,
        background: (t) =>
          `linear-gradient(135deg, ${t.palette.primary.main}1a, ${t.palette.action.hover})`,
      }}
    >
      {image}
    </Box>
  );
}
