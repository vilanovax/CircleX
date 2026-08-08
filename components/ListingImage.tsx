"use client";

import { isListingPhoto, listingImageTint } from "@/lib/listing-image";
import type { ListingType } from "@/lib/types";

/** Emoji glyph size — keep large relative to a tight frame so it doesn't look empty. */
const emojiSizeClass = {
  sm: "text-[1.65rem]",
  md: "text-[2.15rem]",
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
  size?: keyof typeof emojiSizeClass;
  category?: string;
  type?: ListingType;
  className?: string;
  /** Outer frame (rounded box). Defaults by size. */
  frameClassName?: string;
}) {
  const tint = listingImageTint(category, type);
  const photo = isListingPhoto(image);

  const defaultFrame =
    size === "hero"
      ? `h-44 w-full rounded-2xl bg-gradient-to-br ${tint}`
      : size === "sm"
        ? `w-14 h-14 rounded-xl bg-gradient-to-br ${tint}`
        : size === "lg"
          ? `w-12 h-12 rounded-xl bg-gradient-to-br ${tint}`
          : photo
            ? `w-[5.25rem] h-[5.25rem] rounded-2xl bg-gradient-to-br ring-1 ring-black/[0.04] dark:ring-white/5 ${tint}`
            : /* tighter box + larger glyph so emoji fills the frame */
              `w-16 h-16 rounded-xl bg-gradient-to-br ring-1 ring-black/[0.03] dark:ring-white/5 ${tint}`;

  const frame = frameClassName ?? defaultFrame;

  if (photo) {
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
      className={`flex items-center justify-center shrink-0 leading-none ${frame} ${emojiSizeClass[size]} ${className}`}
      aria-hidden={!alt}
    >
      <span className="select-none translate-y-px" aria-hidden>
        {image}
      </span>
    </div>
  );
}
