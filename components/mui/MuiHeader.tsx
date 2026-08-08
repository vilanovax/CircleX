"use client";

import { useRouter } from "next/navigation";
import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material";
import { BackIcon } from "@/components/Icons";

/** MUI variant of the shared page Header (sticky AppBar, optional back button). */
export default function MuiHeader({
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
    <AppBar
      position="sticky"
      elevation={0}
      color="default"
      sx={{
        backdropFilter: "blur(8px)",
        bgcolor: (t) =>
          t.palette.mode === "dark" ? "rgba(24,24,27,0.9)" : "rgba(255,255,255,0.9)",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 56, gap: 1 }}>
        {back && (
          <IconButton edge="start" aria-label="بازگشت" onClick={handleBack} size="small">
            <Box component={BackIcon} className="w-6 h-6" />
          </IconButton>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          {children ?? (
            <>
              <Typography fontWeight={700} lineHeight={1.2} noWrap>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {subtitle}
                </Typography>
              )}
            </>
          )}
        </Box>
        {action}
      </Toolbar>
    </AppBar>
  );
}
