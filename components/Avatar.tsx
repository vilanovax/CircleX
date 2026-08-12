import type { TrustLevel } from "@/lib/types";
import { levelDegreeFa, levelDot, levelHint } from "@/lib/labels";
import { resolveAvatarSrc } from "@/lib/avatar";

const sizes = {
  sm: { box: "w-8 h-8" },
  md: { box: "w-12 h-12" },
  lg: { box: "w-16 h-16" },
};

export default function Avatar({
  name,
  level,
  size = "md",
  src,
  showLevel = true,
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof sizes;
  /** Explicit avatar image; falls back to a stable pool pick from `name`. */
  src?: string;
  /** Hide the degree badge (e.g. when proximity is spelled out in text). */
  showLevel?: boolean;
}) {
  const { box } = sizes[size];
  const imageSrc = resolveAvatarSrc(name, src);

  return (
    <div className="relative shrink-0">
      <div
        className={`${box} rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-black/5 dark:ring-white/10`}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          width={size === "lg" ? 64 : size === "sm" ? 32 : 48}
          height={size === "lg" ? 64 : size === "sm" ? 32 : 48}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      {level && showLevel && (
        <span
          className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full ${levelDot[level]} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900 nums`}
          title={levelHint[level]}
          aria-label={levelHint[level]}
        >
          {levelDegreeFa[level]}
        </span>
      )}
    </div>
  );
}
