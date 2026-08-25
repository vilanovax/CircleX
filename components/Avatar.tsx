import type { TrustLevel } from "@/lib/types";
import { levelDot, levelHint } from "@/lib/labels";
import { resolveAvatarSrc } from "@/lib/avatar";

const sizes = {
  sm: { box: "w-8 h-8", text: "text-[13px]" },
  /** ~10% smaller than md — profile headers */
  profile: { box: "w-11 h-11", text: "text-[15px]" },
  md: { box: "w-12 h-12", text: "text-lg" },
  lg: { box: "w-16 h-16", text: "text-2xl" },
};

export default function Avatar({
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
  const { box } = sizes[size];
  const resolvedSrc = resolveAvatarSrc(
    name,
    src === "initials" || src === "" ? undefined : src,
  );
  const px =
    size === "lg" ? 64 : size === "sm" ? 32 : size === "profile" ? 44 : 48;

  return (
    <div className="relative shrink-0">
      <div
        className={`${box} rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-black/5 dark:ring-white/10`}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedSrc}
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
