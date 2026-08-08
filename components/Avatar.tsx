import type { TrustLevel } from "@/lib/types";
import { levelDot } from "@/lib/labels";
import { personAvatarHex, personInitials } from "@/lib/avatar";

const sizes = {
  sm: { box: "w-8 h-8", text: "text-xs" },
  md: { box: "w-12 h-12", text: "text-lg" },
  lg: { box: "w-16 h-16", text: "text-2xl" },
};

export default function Avatar({
  name,
  level,
  size = "md",
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof sizes;
}) {
  const { box, text } = sizes[size];
  const initials = personInitials(name);
  const bg = personAvatarHex(name);

  return (
    <div className="relative shrink-0">
      <div
        className={`${box} ${text} rounded-full text-white font-bold flex items-center justify-center select-none`}
        style={{ backgroundColor: bg }}
        aria-hidden
      >
        <span>{initials}</span>
      </div>
      {level && (
        <span
          className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full ${levelDot[level]} text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900`}
        >
          {level}
        </span>
      )}
    </div>
  );
}
