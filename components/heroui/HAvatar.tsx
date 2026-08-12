"use client";

import { Avatar, Badge } from "@heroui/react";
import type { TrustLevel } from "@/lib/types";
import { resolveAvatarSrc } from "@/lib/avatar";
import { levelHex } from "./shared";

const SIZES = { sm: "sm", md: "md", lg: "lg" } as const;

/** HeroUI avatar with funny illustration + optional trust-level badge. */
export default function HAvatar({
  name,
  level,
  size = "md",
  src,
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof SIZES;
  src?: string;
}) {
  const imageSrc = resolveAvatarSrc(name, src);
  const avatar = (
    <Avatar
      size={SIZES[size]}
      src={imageSrc}
      name={name}
      classNames={{ img: "object-cover" }}
    />
  );

  if (!level) return avatar;

  return (
    <Badge
      content={level}
      placement="bottom-left"
      shape="circle"
      classNames={{
        badge: "text-[9px] font-bold text-white border-2 border-background",
      }}
      style={{ backgroundColor: levelHex[level] }}
    >
      {avatar}
    </Badge>
  );
}
