"use client";

import { isListingPhoto } from "@/lib/listing-image";

const SIZES = {
  sm: "w-16 h-16 text-3xl",
  md: "w-20 h-20 text-4xl",
  lg: "w-12 h-12 text-2xl",
  hero: "w-full h-44 text-7xl",
} as const;

/** HeroUI-flavored ListingImage: emoji placeholder on a soft tint, or photo.
 *  Uses HeroUI's design tokens (bg-default-*, rounded-large). */
export default function HListingImage({
  image,
  alt = "",
  size = "md",
}: {
  image: string;
  alt?: string;
  size?: keyof typeof SIZES;
}) {
  const isHero = size === "hero";
  const radius = isHero ? "rounded-large" : "rounded-medium";

  if (isListingPhoto(image)) {
    return (
      <div className={`${SIZES[size]} ${radius} overflow-hidden shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={alt} loading="lazy" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      aria-hidden={!alt}
      className={`${SIZES[size]} ${radius} shrink-0 flex items-center justify-center bg-gradient-to-br from-primary-50 to-default-100`}
    >
      {image}
    </div>
  );
}
