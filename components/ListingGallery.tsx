"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { isListingPhoto, listingImageTint } from "@/lib/listing-image";
import type { ListingType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";

function slideIndex(el: HTMLElement, total: number): number {
  const w = el.clientWidth;
  if (!w || total <= 0) return 0;
  // Some RTL engines report negative scrollLeft even on dir=ltr children.
  const left = Math.abs(el.scrollLeft);
  return Math.max(0, Math.min(total - 1, Math.round(left / w)));
}

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
  const slides = images.length > 0 ? images : ["📦"];
  const total = slides.length;
  const multi = total > 1;

  const syncIndex = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setIndex(slideIndex(el, total));
  }, [total]);

  useEffect(() => {
    syncIndex();
  }, [slides, syncIndex]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(total - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  };

  return (
    <div className="relative listing-detail-hero">
      <div
        ref={scrollerRef}
        onScroll={syncIndex}
        dir="ltr"
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-[17.5rem] w-full"
        role="region"
        aria-roledescription="carousel"
        aria-label={`گالری تصاویر ${alt}`}
      >
        {slides.map((src, i) => {
          const photo = isListingPhoto(src);
          return (
            <div
              key={`${i}-${src.slice(0, 48)}`}
              className={`relative h-[17.5rem] w-full shrink-0 snap-center overflow-hidden bg-gradient-to-br ${tint}`}
              aria-hidden={i !== index}
            >
              {photo ? (
                <Image
                  src={src}
                  alt={
                    i === 0
                      ? alt
                      : `${alt} — تصویر ${toPersianDigits(i + 1)}`
                  }
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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[color:var(--circle-canvas)] via-[color:var(--circle-canvas)]/50 to-transparent"
        aria-hidden
      />

      {multi && (
        <>
          <div className="absolute top-3 start-3 z-10 rounded-full bg-black/50 text-white text-[11px] font-bold px-2.5 py-1 nums backdrop-blur-md tracking-wide">
            {toPersianDigits(index + 1)}
            <span className="opacity-70 font-semibold mx-1">/</span>
            {toPersianDigits(total)}
          </div>
          <div
            className="absolute bottom-4 inset-x-0 z-10 flex justify-center gap-1.5"
            role="tablist"
            aria-label="انتخاب تصویر"
          >
            {slides.map((_, i) => (
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
                    : "w-1.5 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
