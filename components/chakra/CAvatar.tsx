"use client";

import { Box, Center } from "@chakra-ui/react";
import type { TrustLevel } from "@/lib/types";
import { personAvatarHex, personInitials } from "@/lib/avatar";

const SIZES = { sm: 36, md: 48, lg: 64 } as const;
const LEVEL_BG: Record<TrustLevel, string> = {
  A: "#16a34a",
  B: "#2563eb",
  C: "#d97706",
};

/** Chakra equivalent of the classic Avatar: initials on a stable color,
 *  with an optional trust-level badge. */
export default function CAvatar({
  name,
  level,
  size = "md",
}: {
  name: string;
  level?: TrustLevel;
  size?: keyof typeof SIZES;
}) {
  const px = SIZES[size];
  return (
    <Box position="relative" flexShrink={0} w={`${px}px`} h={`${px}px`}>
      <Center
        w={`${px}px`}
        h={`${px}px`}
        rounded="full"
        color="white"
        fontWeight="bold"
        fontSize={size === "lg" ? "2xl" : size === "sm" ? "sm" : "lg"}
        bg={personAvatarHex(name)}
        userSelect="none"
      >
        {personInitials(name)}
      </Center>
      {level && (
        <Center
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
          ring="2px"
          ringColor="chakra-body-bg"
          border="2px solid"
          borderColor="chakra-body-bg"
        >
          {level}
        </Center>
      )}
    </Box>
  );
}
