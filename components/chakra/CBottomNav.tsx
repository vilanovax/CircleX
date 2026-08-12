"use client";

import Link from "next/link";
import { useState } from "react";
import { Box, Center, Flex, Text } from "@chakra-ui/react";
import { useStore } from "@/lib/store";
import { toPersianDigits } from "@/lib/persian";
import { lazyUi } from "@/lib/lazy-ui";
import { navActive, useClientPathname } from "@/lib/use-nav-active";
import {
  ChatIcon,
  CircleUsersIcon,
  HomeIcon,
  PlusIcon,
  UserIcon,
} from "@/components/Icons";
import { SHELL_MAX } from "./shared";

const CreateSheet = lazyUi(() => import("@/components/CreateSheet"));

const items = [
  { id: "home", href: "/", label: "خانه", Icon: HomeIcon },
  { id: "circle", href: "/circle", label: "حلقه‌ی من", Icon: CircleUsersIcon },
  { id: "create", label: "ثبت", Icon: PlusIcon, center: true },
  { id: "messages", href: "/messages", label: "پیام‌ها", Icon: ChatIcon },
  { id: "profile", href: "/profile", label: "پروفایل", Icon: UserIcon },
] as const;

/** Chakra variant of the bottom navigation bar. */
export default function CBottomNav() {
  const pathname = useClientPathname();
  const unread = useStore((s) =>
    s.hydrated && s.sessionPhone && s.onboarded ? s.totalUnread() : 0,
  );
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <Box as="nav" position="fixed" insetInline={0} bottom={0} zIndex={30} pointerEvents="none">
        <Box mx="auto" maxW={SHELL_MAX} pointerEvents="auto">
          <Box
            backdropFilter="blur(8px)"
            bg="rgba(255,255,255,0.95)"
            _dark={{ bg: "rgba(24,24,27,0.95)", borderColor: "whiteAlpha.200" }}
            borderTopWidth="1px"
            borderColor="blackAlpha.100"
            boxShadow="0 -1px 12px rgba(16,24,40,0.06)"
            px={2}
            pt={1.5}
            pb="max(0.4rem, env(safe-area-inset-bottom))"
          >
            <Flex as="ul" align="flex-end" justify="space-between" listStyleType="none">
              {items.map((item) => {
                const { id, label, Icon } = item;
                const href = "href" in item ? item.href : undefined;
                const center = "center" in item && item.center;
                const active = navActive(pathname, href);

                if (center) {
                  return (
                    <Flex as="li" key={id} flex={1} justify="center">
                      <Center
                        as="button"
                        onClick={() => setShowCreate(true)}
                        aria-label="ثبت آگهی، درخواست یا رویداد"
                        mt="-24px"
                        w="56px"
                        h="56px"
                        rounded="full"
                        bg="brand.600"
                        color="white"
                        boxShadow="0 8px 18px rgba(124,58,237,0.33)"
                        _active={{ bg: "brand.700" }}
                      >
                        <Box as={Icon} className="w-7 h-7" />
                      </Center>
                    </Flex>
                  );
                }

                const badge = href === "/messages" && unread > 0 ? unread : 0;
                return (
                  <Box as="li" key={id} flex={1}>
                    <Flex
                      as={Link}
                      href={href!}
                      direction="column"
                      align="center"
                      gap={0.5}
                      py={1}
                      color={active ? "brand.600" : "gray.400"}
                      _dark={{ color: active ? "brand.300" : "gray.500" }}
                    >
                      <Box position="relative">
                        <Box as={Icon} className="w-6 h-6" />
                        {badge > 0 && (
                          <Center
                            position="absolute"
                            top="-6px"
                            insetStart="-8px"
                            minW="16px"
                            h="16px"
                            px={1}
                            rounded="full"
                            bg="brand.600"
                            color="white"
                            fontSize="10px"
                            fontWeight="bold"
                          >
                            {toPersianDigits(badge)}
                          </Center>
                        )}
                      </Box>
                      <Text fontSize="11px" fontWeight={500}>
                        {label}
                      </Text>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          </Box>
        </Box>
      </Box>
      {showCreate && <CreateSheet onClose={() => setShowCreate(false)} />}
    </>
  );
}
