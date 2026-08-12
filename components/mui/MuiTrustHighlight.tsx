"use client";

import Link from "next/link";
import { Box, Chip, Stack, Typography } from "@mui/material";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import type { Endorsement, TrustHop } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  endorsementHighlightLine,
  posterCardRelation,
  trustHighlightMessage,
  type TrustContentKind,
} from "@/lib/trust";
import { levelShort } from "@/lib/labels";
import MuiAvatar from "./MuiAvatar";

/** MUI variant of TrustHighlight — the trust signal shown on cards. */
export default function MuiTrustHighlight({
  posterId,
  trustPath,
  endorsements = [],
  posterRole = "فروشنده",
  contentKind = "listing",
  variant = "default",
}: {
  posterId: string;
  trustPath: TrustHop[];
  endorsements?: Endorsement[];
  posterRole?: string;
  contentKind?: TrustContentKind;
  variant?: "default" | "compact";
}) {
  const { getPerson } = useStore();
  const trust = trustHighlightMessage(posterId, trustPath, getPerson, posterRole, contentKind);
  if (!trust) return null;
  const poster = getPerson(posterId);
  if (!poster) return null;

  const endorsementLine = endorsementHighlightLine(endorsements, getPerson, contentKind);
  const isOwn = posterId === "me";
  const relation = posterCardRelation(poster, { isOwn, contentKind });

  if (variant === "compact") {
    const identity = (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
        <MuiAvatar name={poster.name} src={poster.avatar} level={isOwn ? undefined : poster.level} size="sm" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {poster.name}
          </Typography>
          <Typography sx={{ fontSize: 11 }} color={isOwn ? "text.secondary" : "primary"} noWrap>
            {relation}
          </Typography>
        </Box>
      </Stack>
    );

    return (
      <Box sx={{ pb: 1, mb: 1, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isOwn ? (
            identity
          ) : (
            <Box component={Link} href={`/person/${posterId}`} sx={{ flex: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
              {identity}
            </Box>
          )}
          {!isOwn && poster.level && <Chip size="small" label={levelShort[poster.level]} sx={{ height: 20, fontSize: 10 }} />}
          {endorsementLine && !isOwn ? (
            <VerifiedUserOutlinedIcon
              sx={{ fontSize: 18, color: "success.main", flexShrink: 0 }}
              titleAccess={endorsementLine}
              aria-label={endorsementLine}
            />
          ) : (
            <VerifiedUserOutlinedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} aria-hidden />
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: 1,
        p: 1.25,
        mb: 1.25,
        bgcolor: isOwn ? "action.hover" : "primary.main",
        borderColor: isOwn ? "divider" : "primary.main",
        ...(isOwn ? {} : { bgcolor: (t) => `${t.palette.primary.main}14`, borderColor: (t) => `${t.palette.primary.main}40` }),
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <VerifiedUserOutlinedIcon sx={{ fontSize: 22, mt: 0.25, color: isOwn ? "text.secondary" : "primary.main", flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={700} lineHeight={1.4} color={isOwn ? "text.primary" : "primary"}>
            {trust.headline}
          </Typography>
          {trust.subline && (
            <Typography sx={{ fontSize: 12, mt: 0.25 }} fontWeight={600} color={isOwn ? "text.secondary" : "primary"}>
              {trust.subline}
            </Typography>
          )}
          {endorsementLine && !isOwn && (
            <Typography sx={{ fontSize: 11, mt: 0.5 }} color="success.main" fontWeight={500}>
              ✓ {endorsementLine}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
