"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { useSheetA11y } from "@/lib/use-sheet-a11y";
import { useStore } from "@/lib/store";
import MHeader from "@/components/mantine/MHeader";
import MBottomNav from "@/components/mantine/MBottomNav";
import MAvatar from "@/components/mantine/MAvatar";
import { levelColor } from "@/components/mantine/shared";
import { GraphIcon, PlusIcon } from "@/components/Icons";
import {
  levelChip,
  levelLabels,
  levelShort,
  relationEmoji,
  relationLabels,
} from "@/lib/labels";
import type { Person, RelationType, TrustLevel } from "@/lib/types";
import { toPersianDigits } from "@/lib/persian";
import { useToast } from "@/components/Toast";

const LEVELS: TrustLevel[] = ["A", "B", "C"];
const RELATIONS: RelationType[] = [
  "family",
  "friend",
  "colleague",
  "neighbor",
  "acquaintance",
];

export default function CircleMantine() {
  const { people, addPerson, setLevel, hydrated } = useStore();
  const { show } = useToast();
  const mine = people.filter((p) => p.inMyCircle);
  const [showAdd, setShowAdd] = useState(false);

  const counts = useMemo(() => {
    return Object.fromEntries(
      LEVELS.map((lvl) => [lvl, mine.filter((p) => p.level === lvl).length]),
    ) as Record<TrustLevel, number>;
  }, [mine]);

  const grouped = useMemo(() => {
    return LEVELS.map((lvl) => ({
      level: lvl,
      members: mine.filter((p) => p.level === lvl),
    })).filter((g) => g.members.length > 0);
  }, [mine]);

  const total = mine.length;

  return (
    <Box component="main" pb={96} mih="100dvh">
      <MHeader
        title="حلقه‌ی من"
        subtitle={
          mine.length === 0
            ? "هنوز کسی اضافه نشده"
            : `${toPersianDigits(mine.length)} نفر مورد اعتماد`
        }
        action={
          <ActionIcon
            color="brand"
            radius="xl"
            size={36}
            onClick={() => setShowAdd(true)}
            aria-label="افزودن فرد"
          >
            <PlusIcon className="w-5 h-5" />
          </ActionIcon>
        }
      />

      {mine.length === 0 ? (
        <Box px="md" pt={40}>
          <Card withBorder radius="lg" p="lg" ta="center">
            <ThemeIcon
              size={56}
              radius="lg"
              variant="light"
              color="brand"
              mx="auto"
              mb="sm"
            >
              <PlusIcon className="w-7 h-7" />
            </ThemeIcon>
            <Text fw={700}>حلقه‌ات هنوز خالیه</Text>
            <Text fz="sm" c="dimmed" mt={6} style={{ lineHeight: 1.7 }}>
              خانواده، دوستان و آشنایان مورد اعتمادت را اضافه کن تا آگهی‌ها،
              درخواست‌ها و رویدادهای آن‌ها برایت قابل‌مشاهده شود.
            </Text>
            <Button mt="md" onClick={() => setShowAdd(true)}>
              افزودن اولین نفر
            </Button>
          </Card>
        </Box>
      ) : (
        <>
          <Box px="md" pt="sm">
            <Card withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
              <Box p="md">
                <Group justify="space-between" mb="sm" wrap="nowrap">
                  <Box>
                    <Text fw={700} fz="sm">
                      ترکیب اعتماد
                    </Text>
                    <Text fz={11} c="dimmed" mt={2}>
                      A نزدیک‌ترین · با A/B/C سطح را عوض کن
                    </Text>
                  </Box>
                  <Text fz="xs" c="dimmed" fw={700} className="nums">
                    {toPersianDigits(total)} نفر
                  </Text>
                </Group>

                <Group gap={3} h={10} wrap="nowrap" style={{ borderRadius: 999, overflow: "hidden" }}>
                  {LEVELS.map((lvl) => {
                    const n = counts[lvl];
                    if (!n || !total) return null;
                    return (
                      <Box
                        key={lvl}
                        style={{
                          flexGrow: n,
                          flexBasis: 0,
                          height: "100%",
                          background: `var(--mantine-color-${levelColor[lvl]}-6)`,
                        }}
                      />
                    );
                  })}
                </Group>

                <SimpleGrid cols={3} spacing="xs" mt="sm">
                  {LEVELS.map((lvl) => (
                    <Stack
                      key={lvl}
                      gap={4}
                      align="center"
                      p={8}
                      style={{
                        borderRadius: 12,
                        background: `var(--mantine-color-${levelColor[lvl]}-light)`,
                      }}
                    >
                      <Text fz={10} fw={700} c={levelColor[lvl]}>
                        {levelShort[lvl]}
                      </Text>
                      <Text fz="lg" fw={800} className="nums" lh={1}>
                        {toPersianDigits(counts[lvl])}
                      </Text>
                    </Stack>
                  ))}
                </SimpleGrid>
              </Box>

              <Box
                component={Link}
                href="/graph"
                px="md"
                py="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textDecoration: "none",
                  color: "#fff",
                  background:
                    "linear-gradient(to left, var(--mantine-color-brand-7), var(--mantine-color-brand-5))",
                }}
              >
                <ThemeIcon
                  size={36}
                  radius="md"
                  variant="transparent"
                  style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
                >
                  <GraphIcon className="w-5 h-5" />
                </ThemeIcon>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700} fz="sm">
                    نقشه‌ی گراف اعتماد
                  </Text>
                  <Text fz={11} style={{ color: "rgba(255,255,255,0.8)" }}>
                    تو در مرکز — مسیر تا هر نفر
                  </Text>
                </Box>
                <Text fz="lg" style={{ color: "rgba(255,255,255,0.75)" }}>
                  ‹
                </Text>
              </Box>
            </Card>
          </Box>

          <Stack gap="lg" px="md" pt="md">
            {!hydrated ? (
              <Stack gap="xs">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} withBorder radius="lg" p="sm" h={72} />
                ))}
              </Stack>
            ) : (
              grouped.map(({ level, members }) => (
                <Box component="section" key={level}>
                  <Group gap="xs" mb="xs" wrap="nowrap">
                    <Badge variant="light" color={levelColor[level]} radius="sm">
                      {level}
                    </Badge>
                    <Text fw={700} fz="sm">
                      {levelLabels[level]}
                    </Text>
                    <Text
                      fz={11}
                      c="dimmed"
                      fw={600}
                      className="nums"
                      style={{ marginInlineStart: "auto" }}
                    >
                      {toPersianDigits(members.length)}
                    </Text>
                  </Group>
                  <Stack gap="xs">
                    {members.map((p) => (
                      <CircleMemberRow
                        key={p.id}
                        person={p}
                        onSetLevel={(lvl) => {
                          setLevel(p.id, lvl);
                          show(`سطح ${p.name} به ${levelShort[lvl]} تغییر کرد`);
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </>
      )}

      {showAdd && (
        <AddPersonSheet
          onClose={() => setShowAdd(false)}
          onAdd={(input) => {
            addPerson(input);
            setShowAdd(false);
            show(`${input.name} به حلقه‌ی شما اضافه شد ✓`);
          }}
        />
      )}

      <MBottomNav />
    </Box>
  );
}

function CircleMemberRow({
  person,
  onSetLevel,
}: {
  person: Person;
  onSetLevel: (level: TrustLevel) => void;
}) {
  return (
    <Card withBorder radius="lg" p="sm">
      <Group gap="xs" wrap="nowrap" align="center">
        <Box
          component={Link}
          href={`/person/${person.id}`}
          style={{
            minWidth: 0,
            flex: 1,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Group gap="sm" wrap="nowrap">
            <MAvatar name={person.name} src={person.avatar} level={person.level} />
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Group gap={6} wrap="wrap">
                <Text fw={600}>{person.name}</Text>
                <Badge variant="light" color="gray" radius="sm" size="sm">
                  {relationEmoji[person.relation]} {relationLabels[person.relation]}
                </Badge>
              </Group>
              {person.note && (
                <Text fz="xs" c="dimmed" truncate>
                  {person.note}
                </Text>
              )}
              <Text fz={11} c="dimmed">
                {toPersianDigits(person.deals)} معامله‌ی موفق
              </Text>
            </Stack>
          </Group>
        </Box>
        <Group
          gap={4}
          wrap="nowrap"
          style={{ flexShrink: 0 }}
          role="group"
          aria-label={`سطح اعتماد ${person.name}`}
        >
          {LEVELS.map((lvl) => (
            <Button
              key={lvl}
              type="button"
              onClick={() => {
                if (person.level !== lvl) onSetLevel(lvl);
              }}
              aria-pressed={person.level === lvl}
              aria-label={levelShort[lvl]}
              title={levelLabels[lvl]}
              variant={person.level === lvl ? "filled" : "default"}
              color={person.level === lvl ? levelColor[lvl] : undefined}
              radius="md"
              size="compact-sm"
              w={36}
              px={0}
              fw={700}
            >
              {lvl}
            </Button>
          ))}
        </Group>
      </Group>
    </Card>
  );
}

function AddPersonSheet({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (input: {
    name: string;
    relation: RelationType;
    level: TrustLevel;
    note?: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [relation, setRelation] = useState<RelationType>("friend");
  const [level, setLevel] = useState<TrustLevel>("A");
  const [note, setNote] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  useSheetA11y(panelRef, onClose);

  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px]">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-person-title"
          tabIndex={-1}
          className="absolute bottom-0 inset-x-0 bg-white dark:bg-zinc-900 rounded-t-2xl p-5 animate-slide-up outline-none"
        >
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
          <h2 id="add-person-title" className="font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100">
            افزودن به حلقه‌ی من
          </h2>

          <label className="block text-sm font-medium mb-1">نام</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: مریم"
            className="field mb-4"
          />

          <label className="block text-sm font-medium mb-1">نوع رابطه</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {RELATIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRelation(r)}
                className={`chip !px-3 !py-1.5 border ${
                  relation === r
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-zinc-600 border-zinc-200"
                }`}
              >
                {relationEmoji[r]} {relationLabels[r]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">سطح اعتماد</label>
          <div className="flex gap-2 mb-4">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium border ${
                  level === lvl
                    ? `${levelChip[lvl]} border-current`
                    : "bg-white text-zinc-500 border-zinc-200"
                }`}
              >
                {levelLabels[lvl]}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium mb-1">یادداشت (اختیاری)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثلاً: دوست دوران دانشگاه"
            className="field mb-5"
          />

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              انصراف
            </button>
            <button
              disabled={!name.trim()}
              onClick={() =>
                onAdd({ name: name.trim(), relation, level, note: note.trim() || undefined })
              }
              className="btn-primary flex-1"
            >
              افزودن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
