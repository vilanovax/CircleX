import type { TrustLevel } from "@/lib/types";
import { levelDegreeFa, levelDot, levelHint } from "@/lib/labels";
import {
  personAvatarColor,
  personAvatarSoftColor,
  personInitials,
  resolveAvatarSrc,
} from "@/lib/avatar";

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
  soft = false,
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof sizes;
  /** Explicit avatar image; `"initials"` forces letter mark. */
  src?: string;
  /** Hide the degree badge (e.g. when proximity is spelled out in text). */
  showLevel?: boolean;
  /** Softer initials palette for profile heroes. */
  soft?: boolean;
}) {
  const { box, text } = sizes[size];
  const useInitials = src === "initials" || src === "";

  return (
    <div className="relative shrink-0">
      {useInitials ? (
        <div
          className={`${box} ${text} rounded-full flex items-center justify-center font-extrabold ring-1 ring-black/5 dark:ring-white/10 ${
            soft ? personAvatarSoftColor(name) : personAvatarColor(name)
          }`}
          aria-hidden
        >
          {personInitials(name)}
        </div>
      ) : (
        <div
          className={`${box} rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-black/5 dark:ring-white/10`}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveAvatarSrc(name, src)}
            alt=""
            width={
              size === "lg" ? 64 : size === "sm" ? 32 : size === "profile" ? 44 : 48
            }
            height={
              size === "lg" ? 64 : size === "sm" ? 32 : size === "profile" ? 44 : 48
            }
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}
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
