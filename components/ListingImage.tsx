"use client";

import { memo } from "react";
import Image from "next/image";
import { withBasePath, withoutBasePath } from "@/lib/avatar";
import { isListingPhoto, listingImageTint } from "@/lib/listing-image";
import { localListingSrc } from "@/lib/listing-photo";
import { isOptimizablePhotoSrc, PHOTO_SLOT } from "@/lib/media";
import type { ListingType } from "@/lib/types";

const photoPx = {
  sm: PHOTO_SLOT.listingSm,
  md: PHOTO_SLOT.listingMd,
  lg: PHOTO_SLOT.listingLg,
  hero: PHOTO_SLOT.listingHero,
} as const;

/** Emoji glyph size — keep large relative to a tight frame so it doesn't look empty. */
const emojiSizeClass = {
  sm: "text-[1.65rem]",
  md: "text-[2.5rem]",
  lg: "text-5xl",
  hero: "text-7xl",
} as const;

/** Include basePath — required for next/image when the app is served under /circle. */
function listingPhotoSrc(image: string): string {
  const canonical = withoutBasePath(localListingSrc(image.trim()));
  if (canonical.startsWith("data:")) return canonical;
  return withBasePath(canonical);
}

function ListingImage({
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
  className?: string;
  frameClassName?: string;
  category?: string;
  type?: ListingType;
  /** LCP image on feed / detail heroes. */
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
    const src = listingPhotoSrc(image);
    const w = photoPx[size];
    const h = size === "hero" ? 176 : w;
    const sizes =
      size === "hero"
        ? `(max-width: 480px) 100vw, ${PHOTO_SLOT.listingHero}px`
        : `${w}px`;
    const dataUrl = src.startsWith("data:");
    const optimize = !dataUrl && isOptimizablePhotoSrc(src);

    return (
      <div className={`overflow-hidden shrink-0 ${frame} ${className}`}>
        {dataUrl || !optimize ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            width={w}
            height={h}
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        )}
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

export default memo(ListingImage);
