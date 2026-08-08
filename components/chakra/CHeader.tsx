"use client";

import { useRouter } from "next/navigation";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { BackIcon } from "@/components/Icons";

/** Chakra variant of the shared page Header (sticky, optional back button). */
export default function CHeader({
  title,
  subtitle,
  back = false,
  fallbackHref = "/",
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  fallbackHref?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={20}
      backdropFilter="blur(8px)"
      bg="rgba(255,255,255,0.9)"
      _dark={{ bg: "rgba(24,24,27,0.9)", borderColor: "whiteAlpha.200" }}
      borderBottomWidth="1px"
      borderColor="blackAlpha.100"
    >
      <Flex align="center" gap={2} px={4} h="56px">
        {back && (
          <IconButton
            aria-label="بازگشت"
            variant="ghost"
            size="sm"
            ms={-2}
            onClick={handleBack}
            icon={<Box as={BackIcon} className="w-6 h-6" />}
          />
        )}
        <Box minW={0} flex={1}>
          {children ?? (
            <>
              <Text fontWeight={700} lineHeight={1.2} noOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }} noOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </Box>
        {action}
      </Flex>
    </Box>
  );
}
