"use client";

import { Avatar, Badge } from "@heroui/react";
import type { TrustLevel } from "@/lib/types";
import { personAvatarHex, personInitials } from "@/lib/avatar";
import { levelHex } from "./shared";

const SIZES = { sm: "sm", md: "md", lg: "lg" } as const;

/** HeroUI equivalent of the classic Avatar: initials on a stable color with an
 *  optional trust-level badge. */
export default function HAvatar({
  name,
  level,
  size = "md",
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof SIZES;
}) {
  const avatar = (
    <Avatar
      size={SIZES[size]}
      name={personInitials(name)}
      getInitials={(s) => s}
      style={{ backgroundColor: personAvatarHex(name), color: "#fff" }}
      classNames={{ name: "font-bold" }}
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
