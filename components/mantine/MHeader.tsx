"use client";

import { useRouter } from "next/navigation";
import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { BackIcon } from "@/components/Icons";

/** Mantine variant of the shared page Header (sticky, optional back button). */
export default function MHeader({
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
      component="header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(8px)",
        background: "color-mix(in srgb, var(--mantine-color-body) 90%, transparent)",
        borderBottom: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <Group gap="xs" h={56} px="md" wrap="nowrap">
        {back && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={handleBack}
            aria-label="بازگشت"
            ml={-8}
          >
            <BackIcon className="w-6 h-6" />
          </ActionIcon>
        )}
        <Box style={{ minWidth: 0, flex: 1 }}>
          {children ?? (
            <>
              <Text fw={700} lh={1.2} truncate>
                {title}
              </Text>
              {subtitle && (
                <Text fz="xs" c="dimmed" truncate>
                  {subtitle}
                </Text>
              )}
            </>
          )}
        </Box>
        {action}
      </Group>
    </Box>
  );
}
