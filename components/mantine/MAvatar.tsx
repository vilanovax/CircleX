"use client";

import { Avatar, Indicator } from "@mantine/core";
import type { TrustLevel } from "@/lib/types";
import { resolveAvatarSrc } from "@/lib/avatar";
import { levelColor } from "./shared";

const SIZES = { sm: 36, md: 48, lg: 64 } as const;

/** Mantine avatar with funny illustration + optional trust-level indicator. */
export default function MAvatar({
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
  const px = SIZES[size];
  const imageSrc = resolveAvatarSrc(name, src);
  const avatar = (
    <Avatar
      src={imageSrc}
      alt={name}
      size={px}
      radius="xl"
      styles={{
        root: { border: "1px solid rgba(0,0,0,0.06)" },
      }}
    />
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
