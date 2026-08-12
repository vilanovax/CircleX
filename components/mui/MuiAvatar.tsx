"use client";

import { Avatar, Badge } from "@mui/material";
import type { TrustLevel } from "@/lib/types";
import { resolveAvatarSrc } from "@/lib/avatar";
import { levelHex } from "./shared";

const SIZES = { sm: 36, md: 48, lg: 64 } as const;

/** MUI avatar with funny illustration + optional trust-level badge. */
export default function MuiAvatar({
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
      sx={{
        width: px,
        height: px,
        bgcolor: "transparent",
      }}
    />
  );

  if (!level) return avatar;

  return (
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      badgeContent={level}
      sx={{
        "& .MuiBadge-badge": {
          bgcolor: levelHex[level],
          color: "#fff",
          fontSize: 9,
          fontWeight: 700,
          minWidth: 16,
          height: 16,
          border: "2px solid",
          borderColor: "background.paper",
        },
      }}
    >
      {avatar}
    </Badge>
  );
}
