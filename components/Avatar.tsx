import { memo } from "react";
import Image from "next/image";
import type { TrustLevel } from "@/lib/types";
import { levelDot, levelHint } from "@/lib/labels";
import { resolveAvatarSrc, withBasePath, withoutBasePath } from "@/lib/avatar";
import { isOptimizablePhotoSrc, PHOTO_SLOT } from "@/lib/media";

const sizes = {
  sm: { box: "w-8 h-8", text: "text-[13px]", px: PHOTO_SLOT.avatarSm },
  /** ~10% smaller than md — profile headers */
  profile: {
    box: "w-11 h-11",
    text: "text-[15px]",
    px: PHOTO_SLOT.avatarProfile,
  },
  md: { box: "w-12 h-12", text: "text-lg", px: PHOTO_SLOT.avatarMd },
  lg: { box: "w-16 h-16", text: "text-2xl", px: PHOTO_SLOT.avatarLg },
};

function Avatar({
  name,
  level,
  size = "md",
  src,
  showLevel = true,
  eager = false,
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof sizes;
  /** Explicit avatar image path; missing/invalid values use the stable photo pool. */
  src?: string;
  /** Hide the degree badge (e.g. when proximity is spelled out in text). */
  showLevel?: boolean;
  /** Load immediately — above-fold faces on circle/home. */
  eager?: boolean;
  /** @deprecated Unused — all avatars are photos now. */
  soft?: boolean;
}) {
  const { box, px } = sizes[size];
  const resolved = resolveAvatarSrc(
    name,
    src === "initials" || src === "" ? undefined : src,
  );
  const path = withoutBasePath(resolved);
  const optimize = isOptimizablePhotoSrc(path);
  const dataUrl = path.startsWith("data:");
  // next/image under basePath requires the prefix in src.
  const imageSrc = dataUrl ? path : withBasePath(path);

  return (
    <div className="relative shrink-0">
      <div
        className={`${box} relative rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-black/5 dark:ring-white/10`}
        aria-hidden
      >
        {dataUrl || !optimize ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolved}
            alt=""
            width={px}
            height={px}
            className="w-full h-full object-cover"
            draggable={false}
            loading={eager || size === "lg" ? "eager" : "lazy"}
            decoding="async"
            sizes={`${px}px`}
            fetchPriority={eager ? "high" : "auto"}
          />
        ) : (
          <Image
            src={imageSrc}
            alt=""
            width={px}
            height={px}
            sizes={`${px}px`}
            priority={eager}
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}
      </div>
      {level && showLevel && (
        <span
          className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full ${levelDot[level]} ring-2 ring-white dark:ring-zinc-900`}
          title={levelHint[level]}
          aria-label={levelHint[level]}
        />
      )}
    </div>
  );
}

export default memo(Avatar);
