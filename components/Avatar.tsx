import type { TrustLevel } from "@/lib/types";
import { levelDot } from "@/lib/labels";

const sizes = {
  sm: "w-9 h-9 text-lg",
  md: "w-12 h-12 text-2xl",
  lg: "w-16 h-16 text-3xl",
};

export default function Avatar({
  emoji,
  level,
  size = "md",
}: {
  emoji: string;
  level?: TrustLevel;
  size?: keyof typeof sizes;
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={`${sizes[size]} rounded-full bg-zinc-100 flex items-center justify-center select-none`}
      >
        <span>{emoji}</span>
      </div>
      {level && (
        <span
          className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full ${levelDot[level]} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white`}
        >
          {level}
        </span>
      )}
    </div>
  );
}
