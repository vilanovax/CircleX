"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useStore } from "@/lib/store";
import MuiHeader from "@/components/mui/MuiHeader";
import MuiListingImage from "@/components/mui/MuiListingImage";
import MuiAvatar from "@/components/mui/MuiAvatar";
// Complex interactive widgets reused as-is from the classic UI (out of scope to rebuild).
import ReferSheet from "@/components/ReferSheet";
import TrustPath from "@/components/TrustPath";
import { EndorsementList } from "@/components/Endorsements";
import LockedAccess from "@/components/LockedAccess";
import { ChatIcon, ShieldCheckIcon } from "@/components/Icons";
import {
  badgeEmoji,
  badgeLabels,
  formatPrice,
  listingTypeEmoji,
  listingTypeLabels,
  privacyEmoji,
  privacyLabels,
  relationLabels,
} from "@/lib/labels";
import type { BadgeType } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";
import { listingTypeChipColor, SHELL_MAX } from "@/components/mui/shared";

const ALL_BADGES: BadgeType[] = ["verify_item", "know_seller", "verify_quality", "dealt_before"];

export default function ListingMui(_props: { params: { id: string } }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { getListing, getPerson, toggleEndorsement, toggleSaved, isSaved } = useStore();
  const { show } = useToast();
  const [showRefer, setShowRefer] = useState(false);
  const saved = isSaved(id);

  const listing = getListing(id);
  if (!listing) {
    return (
      <Box component="main" sx={{ minHeight: "100dvh" }}>
        <MuiHeader title="آگهی" back />
        <Typography textAlign="center" color="text.disabled" sx={{ py: 10, fontSize: 14 }}>
          آگهی پیدا نشد.
        </Typography>
      </Box>
    );
  }

  const seller = getPerson(listing.sellerId);
  const isMine = listing.sellerId === "me";

  if (!isMine && !canView(listing, getPerson)) {
    return (
      <Box component="main" sx={{ minHeight: "100dvh" }}>
        <MuiHeader title="جزئیات آگهی" back />
        <LockedAccess itemTitle={listing.title} itemKind="listing" privacy={listing.privacy} />
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ pb: 14, minHeight: "100dvh" }}>
      <MuiHeader
        title="جزئیات آگهی"
        back
        action={
          <IconButton
            aria-label={saved ? "حذف از نشان‌شده‌ها" : "نشان کردن"}
            aria-pressed={saved}
            onClick={() => {
              toggleSaved(id);
              show(saved ? "از نشان‌شده‌های پروفایل حذف شد" : "در پروفایل ذخیره شد ✓");
            }}
            sx={{ color: saved ? "#ec4899" : "text.disabled" }}
          >
            {saved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
        }
      />

      <Box sx={{ mx: 2, mt: 2 }}>
        <MuiListingImage image={listing.image} alt={listing.title} size="hero" />
      </Box>

      <Box sx={{ px: 2, pt: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          <Chip size="small" color={listingTypeChipColor[listing.type]} label={`${listingTypeEmoji[listing.type]} ${listingTypeLabels[listing.type]}`} />
          <Chip size="small" label={listing.category} />
          {listing.condition && <Chip size="small" label={listing.condition} />}
        </Stack>

        <Typography variant="h6" fontWeight="bold" lineHeight={1.4}>
          {listing.title}
        </Typography>

        <Box sx={{ mt: 1 }}>
          {listing.price != null ? (
            <Typography variant="h5" fontWeight={800} color="primary">
              {formatPrice(listing.price)}
            </Typography>
          ) : (
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {listing.type === "service" ? "توافقی" : "رایگان"}
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mt: 1.5, whiteSpace: "pre-line" }}>
          {listing.description}
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, color: "text.disabled", fontSize: 12 }}>
          <Typography sx={{ fontSize: 12 }}>📍 {listing.city}</Typography>
          <Typography sx={{ fontSize: 12 }}>·</Typography>
          <Typography sx={{ fontSize: 12 }}>{listing.postedAt}</Typography>
          <Typography sx={{ fontSize: 12 }}>·</Typography>
          <Typography sx={{ fontSize: 12 }} title={privacyLabels[listing.privacy]}>
            {privacyEmoji[listing.privacy]} {privacyLabels[listing.privacy]}
          </Typography>
        </Stack>
      </Box>

      {/* Trust path */}
      <Box sx={{ px: 2, pt: 2.5 }}>
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Box component={ShieldCheckIcon} className="w-5 h-5" sx={{ color: "primary.main" }} />
            <Typography fontWeight={700} variant="body2">
              مسیر اعتماد
            </Typography>
          </Stack>
          <TrustPath posterId={listing.sellerId} trustPath={listing.trustPath} variant="full" />
        </Card>
      </Box>

      {/* Quick referral */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: (t) => `${t.palette.primary.main}14`, color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              📨
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={700} variant="body2">
                این آگهی مناسب کسیه که می‌شناسی؟
              </Typography>
              <Typography sx={{ fontSize: 11 }} color="text.disabled">
                داخل حلقه‌ی اعتمادت معرفی کن — نه اشتراک عمومی
              </Typography>
            </Box>
            <Button variant="contained" size="small" sx={{ flexShrink: 0 }} onClick={() => setShowRefer(true)}>
              معرفی به دوست
            </Button>
          </Stack>
        </Card>
      </Box>

      {/* Seller */}
      {seller && !isMine && (
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardActionArea component={Link} href={`/person/${listing.sellerId}`} sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MuiAvatar name={seller.name} src={seller.avatar} level={seller.level} size="lg" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700}>{seller.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                    {seller.note ? `${seller.note} · ` : ""}
                    {relationLabels[seller.relation]}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                    {toPersianDigits(seller.deals)} معامله‌ی موفق · {seller.city}
                  </Typography>
                </Box>
                <Typography color="text.disabled" variant="h6">‹</Typography>
              </Stack>
            </CardActionArea>
          </Card>
        </Box>
      )}

      {/* Endorsements */}
      <Box sx={{ px: 2, pt: 1.5 }}>
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontWeight={700} variant="body2" sx={{ mb: 1.5 }}>
            🛡️ تأیید و توصیه‌ها
          </Typography>
          <EndorsementList endorsements={listing.endorsements} />

          {!isMine && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
              <Typography sx={{ fontSize: 12, mb: 1 }} color="text.secondary">
                اگر این فروشنده یا کالا را تأیید می‌کنید، نشان خود را اضافه کنید:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                {ALL_BADGES.map((b) => {
                  const active = listing.endorsements.some((e) => e.personId === "me" && e.type === b);
                  return (
                    <Chip
                      key={b}
                      label={`${badgeEmoji[b]} ${badgeLabels[b]}`}
                      onClick={() => toggleEndorsement(listing.id, b)}
                      color={active ? "success" : "default"}
                      variant={active ? "filled" : "outlined"}
                      sx={{ m: 0 }}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}
        </Card>
      </Box>

      {/* Sticky action bar */}
      {!isMine && (
        <Box sx={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 30, pointerEvents: "none" }}>
          <Box sx={{ mx: "auto", maxWidth: SHELL_MAX, pointerEvents: "auto" }}>
            <Box
              sx={{
                backdropFilter: "blur(8px)",
                bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(24,24,27,0.95)" : "rgba(255,255,255,0.95)"),
                borderTop: 1,
                borderColor: "divider",
                p: 1.5,
                pb: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<Box component={ChatIcon} className="w-5 h-5" />}
                onClick={() => router.push(`/messages/${listing.sellerId}`)}
              >
                {listing.type === "donation"
                  ? "پیام برای درخواست این کالا"
                  : listing.type === "service"
                    ? "پیام برای رزرو خدمت"
                    : "پیام به فروشنده"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {showRefer && (
        <ReferSheet listingId={listing.id} listingTitle={listing.title} onClose={() => setShowRefer(false)} />
      )}
    </Box>
  );
}
