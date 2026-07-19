"use client";

import { isListingPhoto, listingImageTint } from "@/lib/listing-image";
import type { ListingType } from "@/lib/types";

const sizeClass = {
  sm: "text-3xl",
  md: "text-4xl",
  feed: "text-5xl",
  lg: "text-5xl",
  hero: "text-7xl",
} as const;

export default function ListingImage({
  image,
  alt = "",
  size = "md",
  category,
  type,
  className = "",
  frameClassName,
}: {
  image: string;
  alt?: string;
  size?: keyof typeof sizeClass;
  category?: string;
  type?: ListingType;
  className?: string;
  /** Outer frame (rounded box). Defaults by size. */
  frameClassName?: string;
}) {
  const tint = listingImageTint(category, type);
  const defaultFrame =
    size === "hero"
      ? `h-44 w-full rounded-2xl bg-gradient-to-br ${tint}`
      : size === "sm"
        ? `w-16 h-16 rounded-xl bg-gradient-to-br ${tint}`
        : size === "lg"
          ? `w-12 h-12 rounded-xl bg-gradient-to-br ${tint}`
          : size === "feed"
            ? `w-24 h-24 rounded-2xl bg-gradient-to-br ${tint}`
            : `w-20 h-20 rounded-xl bg-gradient-to-br ${tint}`;

  const frame = frameClassName ?? defaultFrame;

  if (isListingPhoto(image)) {
    return (
      <div className={`overflow-hidden shrink-0 ${frame} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center shrink-0 ${frame} ${sizeClass[size]} ${className}`}
      aria-hidden={!alt}
    >
      {image}
    </div>
  );
}
