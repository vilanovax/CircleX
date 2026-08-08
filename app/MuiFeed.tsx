"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useStore } from "@/lib/store";
import MuiListingCard from "@/components/mui/MuiListingCard";
import MuiBottomNav from "@/components/mui/MuiBottomNav";
import MuiAvatar from "@/components/mui/MuiAvatar";
import Onboarding from "@/components/Onboarding";
import { CircleUsersIcon, SearchIcon, ShieldCheckIcon } from "@/components/Icons";
import { formatPrice, listingTypeLabels } from "@/lib/labels";
import type { CircleEvent, ListingType, Request } from "@/lib/types";
import { formatEventDateDisplay, normalizeFa, toPersianDigits } from "@/lib/persian";
import { canView, filterByAccess } from "@/lib/trust";

const PREVIEW_LIMIT = 8;

const FILTERS: { key: ListingType | "all"; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "sale", label: listingTypeLabels.sale },
  { key: "service", label: listingTypeLabels.service },
  { key: "donation", label: listingTypeLabels.donation },
  { key: "exchange", label: listingTypeLabels.exchange },
  { key: "loan", label: listingTypeLabels.loan },
];

export default function MuiFeed() {
  const { listings, requests, events, people, getPerson, hydrated, onboarded } = useStore();
  const [filter, setFilter] = useState<ListingType | "all">("all");
  const [query, setQuery] = useState("");

  const circleCount = people.filter((p) => p.inMyCircle).length;

  const { allowed, hidden } = useMemo(() => {
    const { visible, hidden } = filterByAccess(listings, getPerson);
    return { allowed: visible, hidden };
  }, [listings, getPerson]);

  const visibleRequests = useMemo(
    () => requests.filter((r) => canView(r, getPerson)).slice(0, PREVIEW_LIMIT),
    [requests, getPerson],
  );
  const visibleEvents = useMemo(
    () => events.filter((e) => canView(e, getPerson)).slice(0, PREVIEW_LIMIT),
    [events, getPerson],
  );

  const visible = useMemo(() => {
    const q = normalizeFa(query);
    return allowed.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (q && !normalizeFa(`${l.title} ${l.description} ${l.category}`).includes(q)) return false;
      return true;
    });
  }, [allowed, filter, query]);

  const hasFilter = filter !== "all" || query.trim().length > 0;

  return (
    <Box component="main" sx={{ pb: 12, minHeight: "100dvh" }}>
      {/* Sticky header */}
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(8px)",
          bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(24,24,27,0.9)" : "rgba(255,255,255,0.9)"),
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: "primary.main", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box component={ShieldCheckIcon} className="w-5 h-5" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={800} variant="h6" lineHeight={1} color="primary">
                سیرکل
              </Typography>
              <Typography sx={{ fontSize: 11, mt: 0.25 }} color="text.secondary">
                خرید و فروش بین آدم‌های مورد اعتماد
              </Typography>
            </Box>
          </Stack>

          <TextField
            fullWidth
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در آگهی‌های حلقه‌ی شما…"
            sx={{ mt: 1.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box component={SearchIcon} className="w-5 h-5" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1, overflowX: "auto", "&::-webkit-scrollbar": { display: "none" } }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              onClick={() => setFilter(f.key)}
              color={filter === f.key ? "primary" : "default"}
              variant={filter === f.key ? "filled" : "outlined"}
              sx={{ flexShrink: 0 }}
            />
          ))}
        </Stack>
      </Box>

      {/* Trust banner */}
      {!onboarded && (
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Box sx={{ borderRadius: 3, p: 2, color: "#fff", background: (t) => `linear-gradient(to left, ${t.palette.primary.dark}, ${t.palette.primary.main})` }}>
            <Typography fontWeight={700} variant="body2">
              اینجا کسی غریبه نیست
            </Typography>
            <Typography sx={{ fontSize: 12, mt: 0.5, opacity: 0.9, lineHeight: 1.7 }}>
              هر آگهی از مسیر اعتمادی به شما می‌رسد: «این فروشنده، دوستِ همکارِ خواهرِ شماست.»
            </Typography>
          </Box>
        </Box>
      )}

      {/* Quick access */}
      {circleCount <= 2 && (
        <Stack direction="row" spacing={1.25} sx={{ px: 2, pt: 1.5 }}>
          <Shortcut href="/requests" emoji="🔎" label="درخواست‌ها" />
          <Shortcut href="/events" emoji="🎉" label="رویدادها" />
        </Stack>
      )}

      {/* New-user first step */}
      {hydrated && circleCount === 0 && (
        <Box sx={{ px: 2, pt: 2 }}>
          <Card sx={{ p: 2, textAlign: "center", borderRadius: 3 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: (t) => `${t.palette.primary.main}1a`, color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1 }}>
              <Box component={CircleUsersIcon} className="w-6 h-6" />
            </Box>
            <Typography fontWeight={700} variant="body2">
              اول حلقه‌ات را بساز
            </Typography>
            <Typography sx={{ fontSize: 12, mt: 0.5, lineHeight: 1.7 }} color="text.secondary">
              با افزودن خانواده و دوستان مورد اعتماد، آگهی‌ها و رویدادهای آن‌ها اینجا ظاهر می‌شود.
            </Typography>
            <MuiLink component={Link} href="/circle" sx={{ display: "inline-block", mt: 1.5, fontWeight: 600 }} underline="none">
              افزودن به حلقه ←
            </MuiLink>
          </Card>
        </Box>
      )}

      {/* Listings feed */}
      <Box sx={{ px: 2, pt: 2.5 }}>
        <Typography fontWeight={700} variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          آگهی‌ها
        </Typography>
        {!hydrated ? (
          <Stack spacing={1.5}>
            {[0, 1, 2].map((i) => (
              <Card key={i} sx={{ height: 120, borderRadius: 3 }} />
            ))}
          </Stack>
        ) : visible.length === 0 ? (
          <FeedEmptyState hasFilter={hasFilter} onClear={() => { setFilter("all"); setQuery(""); }} />
        ) : (
          <Stack spacing={1.5}>
            {visible.map((l) => (
              <MuiListingCard key={l.id} listing={l} compactTrust />
            ))}
          </Stack>
        )}

        {hidden > 0 && (
          <Stack direction="row" justifyContent="center" spacing={1} sx={{ py: 1, color: "text.disabled" }}>
            <Box component={CircleUsersIcon} className="w-4 h-4" />
            <Typography sx={{ fontSize: 11 }}>
              {toPersianDigits(hidden)} آگهی به‌دلیل تنظیمات حریم خصوصی برای شما قابل نمایش نیست
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Events strip */}
      {visibleEvents.length > 0 && (
        <StripSection title="رویدادهای پیش‌رو" href="/events">
          {visibleEvents.map((ev) => <EventStripCard key={ev.id} event={ev} />)}
        </StripSection>
      )}

      {/* Requests strip */}
      {visibleRequests.length > 0 && (
        <StripSection title="درخواست‌های حلقه" href="/requests">
          {visibleRequests.map((r) => <RequestStripCard key={r.id} request={r} />)}
        </StripSection>
      )}

      <Onboarding />
      <MuiBottomNav />
    </Box>
  );
}

function Shortcut({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Card sx={{ flex: 1, borderRadius: 3 }}>
      <CardActionArea component={Link} href={href} sx={{ p: 1.5 }}>
        <Stack spacing={0.75} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, bgcolor: (t) => `${t.palette.primary.main}14`, color: "primary.main" }}>
            {emoji}
          </Box>
          <Typography sx={{ fontSize: 12 }} fontWeight={700}>
            {label}
          </Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

function StripSection({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <Box sx={{ pt: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, mb: 1.25 }}>
        <Typography fontWeight={700} variant="body2" color="text.secondary">
          {title}
        </Typography>
        {href && (
          <MuiLink component={Link} href={href} sx={{ fontSize: 12, fontWeight: 500 }} underline="none">
            همه
          </MuiLink>
        )}
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ px: 2, pb: 0.5, overflowX: "auto", "&::-webkit-scrollbar": { display: "none" } }}>
        {children}
      </Stack>
    </Box>
  );
}

function FeedEmptyState({ hasFilter, onClear }: { hasFilter: boolean; onClear: () => void }) {
  return (
    <Card sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "action.hover", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, mx: "auto", mb: 1.5 }}>
        🔍
      </Box>
      <Typography fontWeight={700} variant="body2">
        {hasFilter ? "نتیجه‌ای پیدا نشد" : "هنوز آگهی‌ای نیست"}
      </Typography>
      <Typography sx={{ fontSize: 12, mt: 0.75, lineHeight: 1.7 }} color="text.secondary">
        {hasFilter ? "فیلتر یا جستجو را عوض کن، یا اولین آگهی را ثبت کن." : "با ثبت آگهی یا گسترش حلقه، فیدت پر می‌شود."}
      </Typography>
      <Stack spacing={1} sx={{ mt: 2 }} alignItems="center">
        {hasFilter && (
          <MuiLink component="button" onClick={onClear} sx={{ fontSize: 14 }} underline="none">
            پاک کردن فیلتر و جستجو
          </MuiLink>
        )}
        <MuiLink component={Link} href="/new" sx={{ fontSize: 14, fontWeight: 600 }} underline="none">
          ثبت آگهی
        </MuiLink>
      </Stack>
    </Card>
  );
}

function EventStripCard({ event }: { event: CircleEvent }) {
  const { getPerson } = useStore();
  const host = getPerson(event.hostId);
  const count = event.attendees.length;

  return (
    <Card sx={{ width: 192, flexShrink: 0, borderRadius: 3 }}>
      <CardActionArea component={Link} href={`/event/${event.id}`} sx={{ p: 1.5 }}>
        {host && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <MuiAvatar name={host.name} level={host.level} size="sm" />
            <Typography sx={{ fontSize: 11 }} color="text.secondary" noWrap>
              {host.name}
            </Typography>
          </Stack>
        )}
        <Box sx={{ height: 56, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, mb: 1, background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}1a, ${t.palette.action.hover})` }}>
          {event.image}
        </Box>
        <Typography sx={{ fontSize: 13, lineHeight: 1.3 }} fontWeight={600} className="line-clamp-2">
          {event.title}
        </Typography>
        <Typography sx={{ fontSize: 11, mt: 0.5 }} fontWeight={500} color="primary">
          📅 {formatEventDateDisplay(event.date)}
        </Typography>
        <Typography sx={{ fontSize: 11, mt: 0.25 }} color="text.disabled" noWrap>
          📍 {event.location}
        </Typography>
        <Typography sx={{ fontSize: 10, mt: 0.5 }} color="text.disabled">
          {toPersianDigits(count)} نفر{event.capacity ? ` از ${toPersianDigits(event.capacity)}` : ""}
        </Typography>
      </CardActionArea>
    </Card>
  );
}

function RequestStripCard({ request }: { request: Request }) {
  const { getPerson, getOffers } = useStore();
  const requester = getPerson(request.requesterId);
  const offers = getOffers(request.id);

  return (
    <Card sx={{ width: 192, flexShrink: 0, borderRadius: 3 }}>
      <CardActionArea component={Link} href={`/request/${request.id}`} sx={{ p: 1.5 }}>
        {requester && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <MuiAvatar name={requester.name} level={requester.level} size="sm" />
            <Typography sx={{ fontSize: 11 }} color="text.secondary" noWrap>
              {requester.name}
            </Typography>
          </Stack>
        )}
        <Box sx={{ height: 56, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, mb: 1, background: (t) => `linear-gradient(135deg, ${t.palette.warning.main}1a, ${t.palette.action.hover})` }}>
          {request.image}
        </Box>
        <Typography sx={{ fontSize: 13, lineHeight: 1.3 }} fontWeight={600} className="line-clamp-2">
          {request.title}
        </Typography>
        <Typography sx={{ fontSize: 11, mt: 0.5 }} color="text.secondary" noWrap>
          {request.category}
        </Typography>
        {request.budget != null && (
          <Typography sx={{ fontSize: 11, mt: 0.25 }} fontWeight={700} color="primary">
            تا {formatPrice(request.budget)}
          </Typography>
        )}
        {offers.length > 0 && (
          <Typography sx={{ fontSize: 10, mt: 0.5 }} fontWeight={500} color="primary">
            {toPersianDigits(offers.length)} پیشنهاد
          </Typography>
        )}
      </CardActionArea>
    </Card>
  );
}
