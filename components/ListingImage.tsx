"use client";

import { withBasePath } from "@/lib/avatar";
import { isListingPhoto, listingImageTint } from "@/lib/listing-image";
import type { ListingType } from "@/lib/types";

const photoPx = {
  sm: 56,
  md: 96,
  lg: 48,
  hero: 480,
} as const;

/** Emoji glyph size — keep large relative to a tight frame so it doesn't look empty. */
const emojiSizeClass = {
  sm: "text-[1.65rem]",
  md: "text-[2.5rem]",
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
  priority = false,
}: {
  image: string;
  alt?: string;
  size?: keyof typeof emojiSizeClass;
  category?: string;
  type?: ListingType;
  className?: string;
  /** Outer frame (rounded box). Defaults by size. */
  frameClassName?: string;
  /** LCP image on detail heroes. */
  priority?: boolean;
}) {
  const tint = listingImageTint(category, type);
  const photo = isListingPhoto(image);

  const defaultFrame =
    size === "hero"
      ? `relative h-44 w-full rounded-2xl bg-gradient-to-br ${tint}`
      : size === "sm"
        ? `relative w-14 h-14 rounded-xl bg-gradient-to-br ${tint}`
        : size === "lg"
          ? `relative w-12 h-12 rounded-xl bg-gradient-to-br ${tint}`
          : `relative w-24 h-24 rounded-xl bg-gradient-to-br ring-1 ring-black/[0.04] dark:ring-white/5 ${tint}`;

  const frame = frameClassName
    ? frameClassName.includes("relative")
      ? frameClassName
      : `relative ${frameClassName}`
    : defaultFrame;

  if (photo) {
    return (
      <div className={`overflow-hidden shrink-0 ${frame} ${className}`}>
        <img
          src={withBasePath(image)}
          alt={alt}
          width={photoPx[size]}
          height={size === "hero" ? 176 : photoPx[size]}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
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
