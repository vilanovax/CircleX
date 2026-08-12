"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { isListingPhoto, listingImageTint } from "@/lib/listing-image";
import type { ListingType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";

export default function ListingGallery({
  images,
  alt,
  category,
  type,
}: {
  images: string[];
  alt: string;
  category?: string;
  type?: ListingType;
}) {
  const tint = listingImageTint(category, type);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = images.length;
  const multi = total > 1;

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(Math.max(0, Math.min(total - 1, next)));
  }, [total]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  };

  return (
    <div className="relative listing-detail-hero">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        dir="ltr"
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-56 w-full"
        role="region"
        aria-roledescription="carousel"
        aria-label={`گالری تصاویر ${alt}`}
      >
        {images.map((src, i) => {
          const photo = isListingPhoto(src);
          return (
            <div
              key={`${src}-${i}`}
              className={`relative h-56 w-full shrink-0 snap-center overflow-hidden bg-gradient-to-br ${tint}`}
              aria-hidden={i !== index}
            >
              {photo ? (
                <Image
                  src={src}
                  alt={i === 0 ? alt : `${alt} — تصویر ${toPersianDigits(i + 1)}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 480px) 100vw, 480px"
                  priority={i === 0}
                  unoptimized={
                    src.startsWith("data:") ||
                    src.startsWith("http://") ||
                    src.startsWith("https://")
                  }
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-7xl leading-none">
                  <span className="select-none" aria-hidden>
                    {src}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[color:var(--circle-canvas)] via-[color:var(--circle-canvas)]/55 to-transparent"
        aria-hidden
      />

      {multi && (
        <>
          <div className="absolute top-3 left-3 z-10 rounded-full bg-black/55 text-white text-[11px] font-bold px-2.5 py-1 nums backdrop-blur-sm">
            {toPersianDigits(index + 1)} از {toPersianDigits(total)}
          </div>
          <div
            className="absolute bottom-3 inset-x-0 z-10 flex justify-center gap-1.5"
            role="tablist"
            aria-label="انتخاب تصویر"
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`تصویر ${toPersianDigits(i + 1)}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index
                    ? "w-5 bg-white shadow-sm"
                    : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
