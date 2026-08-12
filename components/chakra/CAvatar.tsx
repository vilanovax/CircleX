"use client";

import { Box, Image } from "@chakra-ui/react";
import type { TrustLevel } from "@/lib/types";
import { resolveAvatarSrc } from "@/lib/avatar";

const SIZES = { sm: 36, md: 48, lg: 64 } as const;
const LEVEL_BG: Record<TrustLevel, string> = {
  A: "#16a34a",
  B: "#2563eb",
  C: "#d97706",
};

/** Chakra avatar with funny illustration + optional trust-level badge. */
export default function CAvatar({
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
  return (
    <Box position="relative" flexShrink={0} w={`${px}px`} h={`${px}px`}>
      <Image
        src={imageSrc}
        alt={name}
        w={`${px}px`}
        h={`${px}px`}
        rounded="full"
        objectFit="cover"
        bg="gray.100"
        userSelect="none"
        draggable={false}
      />
      {level && (
        <Box
          position="absolute"
          bottom="-2px"
          insetStart="-2px"
          w="16px"
          h="16px"
          rounded="full"
          bg={LEVEL_BG[level]}
          color="white"
          fontSize="9px"
          fontWeight="bold"
          display="flex"
          alignItems="center"
          justifyContent="center"
          ring="2px"
          ringColor="chakra-body-bg"
          border="2px solid"
          borderColor="chakra-body-bg"
        >
          {level}
        </Box>
      )}
    </Box>
  );
}
