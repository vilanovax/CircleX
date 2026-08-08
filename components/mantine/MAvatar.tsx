"use client";

import { Avatar, Indicator } from "@mantine/core";
import type { TrustLevel } from "@/lib/types";
import { personAvatarHex, personInitials } from "@/lib/avatar";
import { levelColor } from "./shared";

const SIZES = { sm: 36, md: 48, lg: 64 } as const;

/** Mantine equivalent of the classic Avatar: initials on a stable color,
 *  with an optional trust-level indicator. */
export default function MAvatar({
  name,
  level,
  size = "md",
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof SIZES;
}) {
  const px = SIZES[size];
  const avatar = (
    <Avatar
      size={px}
      radius="xl"
      variant="filled"
      styles={{
        placeholder: {
          backgroundColor: personAvatarHex(name),
          color: "#fff",
          fontWeight: 700,
        },
      }}
    >
      {personInitials(name)}
    </Avatar>
  );

  if (!level) return avatar;

  return (
    <Indicator
      inline
      size={size === "sm" ? 14 : 16}
      offset={4}
      position="bottom-start"
      color={levelColor[level]}
      withBorder
      label={level}
      styles={{ indicator: { fontSize: 9, fontWeight: 700, padding: 0 } }}
    >
      {avatar}
    </Indicator>
  );
}
