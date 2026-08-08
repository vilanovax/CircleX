"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
} from "@mantine/core";
import { useStore } from "@/lib/store";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import MHeader from "@/components/mantine/MHeader";
import MAvatar from "@/components/mantine/MAvatar";
import MTrustHighlight from "@/components/mantine/MTrustHighlight";
import { SHELL_MAX } from "@/components/mantine/shared";
import { formatPrice, privacyEmoji, privacyLabels, relationLabels } from "@/lib/labels";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
// Reuse the existing classic LockedAccess overlay as-is (out of scope to rebuild).
import LockedAccess from "@/components/LockedAccess";
import { canView } from "@/lib/trust";
import { useToast } from "@/components/Toast";

export default function RequestMantine(_props: { params: { id: string } }) {
  const params = useParams();
  const id = String(params.id);
  const { getRequest, getPerson, getOffers, hasOffered, addOffer, withdrawOffer } =
    useStore();
  const { show } = useToast();
  const [showOffer, setShowOffer] = useState(false);

  const request = getRequest(id);
  if (!request) {
    return (
      <Box component="main" mih="100dvh">
        <MHeader title="درخواست" back />
        <Text ta="center" c="dimmed" py={80} fz="sm">
          درخواست پیدا نشد.
        </Text>
      </Box>
    );
  }

  const requester = getPerson(request.requesterId);
  const isMine = request.requesterId === "me";

  if (!isMine && !canView(request, getPerson)) {
    return (
      <Box component="main" mih="100dvh">
        <MHeader title="جزئیات درخواست" back />
        <LockedAccess
          itemTitle={request.title}
          itemKind="request"
          privacy={request.privacy}
        />
      </Box>
    );
  }

  const offers = getOffers(id);
  const offered = hasOffered(id);

  return (
    <Box component="main" pb={32} mih="100dvh">
      <MHeader title="جزئیات درخواست" back />

      {/* Header card */}
      <Box px="md" pt="md">
        <Group gap="xs" mb="xs">
          <Badge variant="light" color="yellow" radius="sm">
            🔎 درخواست
          </Badge>
          <Badge variant="light" color="gray" radius="sm">
            {request.category}
          </Badge>
          <Text fz={11} c="dimmed" title={privacyLabels[request.privacy]}>
            {privacyEmoji[request.privacy]}
          </Text>
        </Group>

        <Group align="flex-start" gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              background:
                "linear-gradient(135deg, var(--mantine-color-yellow-light), var(--mantine-color-default-hover))",
            }}
          >
            {request.image}
          </Box>
          <Box style={{ minWidth: 0 }}>
            <Text component="h1" fz="lg" fw={700} lh={1.3}>
              {request.title}
            </Text>
            {request.budget != null && (
              <Text fz="sm" fw={700} c="brand.7" mt={4}>
                بودجه: تا {formatPrice(request.budget)}
              </Text>
            )}
          </Box>
        </Group>

        <Text
          fz="sm"
          c="dimmed"
          mt="sm"
          style={{ lineHeight: 1.7, whiteSpace: "pre-line" }}
        >
          {request.description}
        </Text>

        <Group gap="xs" mt="sm" c="dimmed" fz="xs">
          <Text fz="xs" c="dimmed">
            📍 {request.city}
          </Text>
          <Text fz="xs" c="dimmed">
            ·
          </Text>
          <Text fz="xs" c="dimmed">
            {request.postedAt}
          </Text>
        </Group>
      </Box>

      {/* Trust path */}
      <Box px="md" pt="lg">
        <MTrustHighlight
          posterId={request.requesterId}
          trustPath={request.trustPath}
          posterRole="درخواست‌دهنده"
          contentKind="request"
          variant="default"
        />
      </Box>

      {/* Requester */}
      {requester && !isMine && (
        <Box px="md" pt="xs">
          <Card
            component={Link}
            href={`/person/${request.requesterId}`}
            withBorder
            radius="lg"
            p="md"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Group gap="sm" wrap="nowrap">
              <MAvatar name={requester.name} level={requester.level} size="lg" />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={700}>{requester.name}</Text>
                <Text fz="xs" c="dimmed" mt={2}>
                  {requester.note ? `${requester.note} · ` : ""}
                  {relationLabels[requester.relation]}
                </Text>
                <Text fz="xs" c="dimmed" mt={4}>
                  {toPersianDigits(requester.deals)} معامله‌ی موفق · {requester.city}
                </Text>
              </Box>
              <Text c="dimmed" fz="lg">
                ‹
              </Text>
            </Group>
          </Card>
        </Box>
      )}

      {/* Offers */}
      <Box px="md" pt="xs">
        <Card withBorder radius="lg" p="md">
          <Text fw={700} fz="sm" mb="sm">
            پیشنهادها{" "}
            <Text component="span" c="dimmed" fw={400}>
              ({toPersianDigits(offers.length)})
            </Text>
          </Text>

          {offers.length === 0 ? (
            <Text fz="sm" c="dimmed">
              هنوز کسی پیشنهاد نداده. اولین نفر باش!
            </Text>
          ) : (
            <Stack gap="sm">
              {offers.map((o) => {
                const from = getPerson(o.fromId);
                const mine = o.fromId === "me";
                return (
                  <Group key={o.id} gap={10} align="flex-start" wrap="nowrap">
                    {from || mine ? (
                      <MAvatar
                        name={mine ? "شما" : from!.name}
                        level={mine ? undefined : from!.level}
                        size="sm"
                      />
                    ) : (
                      <Box
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: "var(--mantine-color-default-hover)",
                        }}
                      />
                    )}
                    <Box style={{ minWidth: 0, flex: 1 }}>
                      <Group gap={6} wrap="nowrap">
                        <Text fz="sm" fw={500}>
                          {mine ? "شما" : from?.name ?? "ناشناس"}
                        </Text>
                        {o.price != null && (
                          <Badge variant="light" color="brand" radius="sm">
                            {formatPrice(o.price)}
                          </Badge>
                        )}
                        <Text fz={11} c="dimmed" style={{ marginInlineStart: "auto" }}>
                          {o.postedAt}
                        </Text>
                      </Group>
                      <Text fz="sm" c="dimmed" mt={2} style={{ lineHeight: 1.7 }}>
                        {o.message}
                      </Text>
                    </Box>
                  </Group>
                );
              })}
            </Stack>
          )}
        </Card>
      </Box>

      {/* Offer action */}
      {!isMine && (
        <Box px="md" pt="md">
          {offered ? (
            <Group gap="xs" wrap="nowrap">
              <Button
                variant="light"
                color="green"
                radius="md"
                style={{ flex: 1 }}
                styles={{ root: { pointerEvents: "none" } }}
              >
                ✓ پیشنهاد شما ثبت شد
              </Button>
              <Button
                variant="default"
                radius="md"
                onClick={() => {
                  withdrawOffer(id);
                  show("پیشنهاد لغو شد");
                }}
              >
                لغو
              </Button>
            </Group>
          ) : (
            <Button
              color="brand"
              radius="md"
              size="md"
              fullWidth
              onClick={() => setShowOffer(true)}
            >
              این رو دارم — پیشنهاد می‌دهم
            </Button>
          )}
        </Box>
      )}

      {showOffer && (
        <OfferSheet
          onClose={() => setShowOffer(false)}
          onSubmit={(message, price) => {
            addOffer({ requestId: id, message, price });
            setShowOffer(false);
            show("پیشنهاد شما ارسال شد ✓");
          }}
        />
      )}
    </Box>
  );
}

function OfferSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (message: string, price?: number) => void;
}) {
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <Box style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", justifyContent: "center" }}>
      <Box style={{ position: "relative", width: "100%", maxWidth: SHELL_MAX }}>
        <Box
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }}
          onClick={onClose}
          aria-hidden
        />
        <Paper
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-sheet-title"
          tabIndex={-1}
          radius="lg"
          p="lg"
          style={{
            position: "absolute",
            bottom: 0,
            insetInline: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            outline: "none",
          }}
        >
          <Box
            style={{
              width: 40,
              height: 4,
              borderRadius: 9999,
              margin: "0 auto var(--mantine-spacing-md)",
              background: "var(--mantine-color-default-border)",
            }}
          />
          <Text id="offer-sheet-title" component="h2" fw={700} fz="lg" mb={4}>
            پیشنهاد شما
          </Text>
          <Text fz="xs" c="dimmed" mb="md">
            توضیح بده چی داری؛ درخواست‌دهنده از حلقه‌ی شماست.
          </Text>

          <Textarea
            label="پیام"
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            placeholder="مثلاً: یه نمونه‌ی سالم دارم، می‌تونم عکس بفرستم…"
            rows={3}
            autosize={false}
            mb="md"
            styles={{ label: { fontWeight: 500, marginBottom: 4 } }}
          />

          <TextInput
            label="قیمت پیشنهادی (اختیاری)"
            value={price}
            onChange={(e) => setPrice(e.currentTarget.value)}
            inputMode="numeric"
            placeholder="تومان"
            mb="lg"
            styles={{ label: { fontWeight: 500, marginBottom: 4 } }}
          />

          <Group gap="xs" grow>
            <Button variant="default" radius="md" onClick={onClose}>
              انصراف
            </Button>
            <Button
              color="brand"
              radius="md"
              disabled={!message.trim()}
              onClick={() =>
                onSubmit(
                  message.trim(),
                  price
                    ? Number(toEnglishDigits(price).replace(/\D/g, "")) || undefined
                    : undefined,
                )
              }
            >
              ارسال پیشنهاد
            </Button>
          </Group>
        </Paper>
      </Box>
    </Box>
  );
}
