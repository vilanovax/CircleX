import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { getSessionUser } from "@/lib/server-auth";
import {
  WATCH_KIND,
  WATCH_PERSON_CAP,
  WATCH_PHRASE_CAP,
  parseWatchPhrase,
} from "@/lib/watch-match";

export const dynamic = "force-dynamic";

function toClientWatch(row: {
  id: string;
  kind: string;
  phrase: string | null;
  enabled: boolean;
  createdAt: Date;
  targetUserId: string | null;
  target: { id: string; name: string; avatar: string } | null;
}) {
  return {
    id: row.id,
    kind: row.kind,
    phrase: row.phrase,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    target: row.target
      ? {
          id: row.target.id,
          name: row.target.name || "عضو حلقه",
          avatar: row.target.avatar,
        }
      : null,
  };
}

const watchInclude = {
  target: { select: { id: true, name: true, avatar: true } },
} as const;

export async function GET() {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const rows = await prisma.listingWatch.findMany({
      where: { userId: session.id },
      include: watchInclude,
      orderBy: { createdAt: "asc" },
    });
    return Response.json({ watches: rows.map(toClientWatch) });
  });
}

export async function POST(req: Request) {
  return withDb(async () => {
    const session = await getSessionUser();
    if (!session) return jsonError("وارد نشده‌ای", 401, "unauthorized");

    const body = await readJson<{ kind?: unknown; phrase?: unknown; personId?: unknown }>(
      req,
    );
    const kind = body?.kind === WATCH_KIND.person ? WATCH_KIND.person : WATCH_KIND.phrase;

    if (kind === WATCH_KIND.phrase) {
      const parsed = parseWatchPhrase(body?.phrase);
      if (!parsed.ok) return jsonError(parsed.error, 400);

      const count = await prisma.listingWatch.count({
        where: { userId: session.id, kind: WATCH_KIND.phrase },
      });
      if (count >= WATCH_PHRASE_CAP) {
        return jsonError("حداکثر پنج عبارت می‌توانی داشته باشی", 400);
      }

      try {
        const row = await prisma.listingWatch.create({
          data: {
            userId: session.id,
            kind: WATCH_KIND.phrase,
            phrase: parsed.phrase,
            phraseNorm: parsed.phraseNorm,
          },
          include: watchInclude,
        });
        return Response.json({ watch: toClientWatch(row) });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          return jsonError("این عبارت را از قبل داری", 409);
        }
        throw err;
      }
    }

    const personId =
      typeof body?.personId === "string" ? body.personId.trim() : "";
    if (!personId || personId === session.id) {
      return jsonError("این شخص را نمی‌توانی انتخاب کنی", 400);
    }

    const edge = await prisma.circleEdge.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: session.id,
          toUserId: personId,
        },
      },
      select: { id: true },
    });
    if (!edge) return jsonError("فقط اعضای حلقه‌ات را می‌توانی انتخاب کنی", 400);

    const count = await prisma.listingWatch.count({
      where: { userId: session.id, kind: WATCH_KIND.person },
    });
    if (count >= WATCH_PERSON_CAP) {
      return jsonError("حداکثر پنج نفر می‌توانی داشته باشی", 400);
    }

    try {
      const row = await prisma.listingWatch.create({
        data: {
          userId: session.id,
          kind: WATCH_KIND.person,
          targetUserId: personId,
        },
        include: watchInclude,
      });
      return Response.json({ watch: toClientWatch(row) });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return jsonError("این نفر را از قبل داری", 409);
      }
      throw err;
    }
  });
}
