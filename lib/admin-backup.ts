import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import { uploadDir } from "./listing-upload";

export const BACKUP_FORMAT = 1 as const;

const TABLES = [
  ["users", () => prisma.user.findMany({ orderBy: { createdAt: "asc" } })],
  ["sessions", () => prisma.session.findMany({ orderBy: { createdAt: "asc" } })],
  [
    "otpChallenges",
    () => prisma.otpChallenge.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  ["invites", () => prisma.invite.findMany({ orderBy: { createdAt: "asc" } })],
  [
    "inviteExpected",
    () => prisma.inviteExpected.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "inviteAcceptances",
    () => prisma.inviteAcceptance.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "circleJoinRequests",
    () => prisma.circleJoinRequest.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "circleEdges",
    () => prisma.circleEdge.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "listings",
    () => prisma.marketListing.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "listingEndorsements",
    () =>
      prisma.listingEndorsement.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "listingReports",
    () => prisma.listingReport.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "messages",
    () => prisma.directMessage.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "messageReports",
    () => prisma.messageReport.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "requests",
    () => prisma.wantRequest.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "requestOffers",
    () => prisma.wantOffer.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "events",
    () => prisma.gathering.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "eventRsvps",
    () => prisma.gatheringRsvp.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "savedListings",
    () => prisma.savedListing.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "listingViews",
    () => prisma.listingView.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "listingWatches",
    () => prisma.listingWatch.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "systemNotices",
    () => prisma.systemNotice.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "threadPreferences",
    () => prisma.threadPreference.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "adminUsers",
    () => prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "adminSessions",
    () => prisma.adminSession.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "adminAuditLogs",
    () => prisma.adminAuditLog.findMany({ orderBy: { createdAt: "asc" } }),
  ],
  [
    "appSettings",
    () => prisma.appSetting.findMany({ orderBy: { updatedAt: "asc" } }),
  ],
  [
    "broadcasts",
    () => prisma.broadcast.findMany({ orderBy: { createdAt: "asc" } }),
  ],
] as const;

export type BackupCounts = Record<(typeof TABLES)[number][0], number>;

export type BackupSummary = {
  format: typeof BACKUP_FORMAT;
  generatedAt: string;
  counts: BackupCounts;
  uploadFiles: number;
  uploadBytes: number;
};

function jsonSafe(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = jsonSafe(nested);
    }
    return out;
  }
  return value;
}

async function listUploads(): Promise<{
  files: Record<string, string>;
  bytes: number;
}> {
  const dir = uploadDir();
  const files: Record<string, string> = {};
  let bytes = 0;
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return { files, bytes };
  }
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    try {
      const info = await stat(full);
      if (!info.isFile()) continue;
      const buf = await readFile(full);
      files[name] = buf.toString("base64");
      bytes += buf.length;
    } catch {
      /* skip unreadable */
    }
  }
  return { files, bytes };
}

export async function backupSummary(): Promise<BackupSummary> {
  const pairs = await Promise.all([
    prisma.user.count().then((n) => ["users", n] as const),
    prisma.session.count().then((n) => ["sessions", n] as const),
    prisma.otpChallenge.count().then((n) => ["otpChallenges", n] as const),
    prisma.invite.count().then((n) => ["invites", n] as const),
    prisma.inviteExpected.count().then((n) => ["inviteExpected", n] as const),
    prisma.inviteAcceptance
      .count()
      .then((n) => ["inviteAcceptances", n] as const),
    prisma.circleJoinRequest
      .count()
      .then((n) => ["circleJoinRequests", n] as const),
    prisma.circleEdge.count().then((n) => ["circleEdges", n] as const),
    prisma.marketListing.count().then((n) => ["listings", n] as const),
    prisma.listingEndorsement
      .count()
      .then((n) => ["listingEndorsements", n] as const),
    prisma.listingReport.count().then((n) => ["listingReports", n] as const),
    prisma.directMessage.count().then((n) => ["messages", n] as const),
    prisma.messageReport.count().then((n) => ["messageReports", n] as const),
    prisma.wantRequest.count().then((n) => ["requests", n] as const),
    prisma.wantOffer.count().then((n) => ["requestOffers", n] as const),
    prisma.gathering.count().then((n) => ["events", n] as const),
    prisma.gatheringRsvp.count().then((n) => ["eventRsvps", n] as const),
    prisma.savedListing.count().then((n) => ["savedListings", n] as const),
    prisma.listingView.count().then((n) => ["listingViews", n] as const),
    prisma.listingWatch.count().then((n) => ["listingWatches", n] as const),
    prisma.systemNotice.count().then((n) => ["systemNotices", n] as const),
    prisma.threadPreference
      .count()
      .then((n) => ["threadPreferences", n] as const),
    prisma.adminUser.count().then((n) => ["adminUsers", n] as const),
    prisma.adminSession.count().then((n) => ["adminSessions", n] as const),
    prisma.adminAuditLog.count().then((n) => ["adminAuditLogs", n] as const),
    prisma.appSetting.count().then((n) => ["appSettings", n] as const),
    prisma.broadcast.count().then((n) => ["broadcasts", n] as const),
  ]);
  const counts = Object.fromEntries(pairs) as BackupCounts;
  const dir = uploadDir();
  let uploadFiles = 0;
  let uploadBytes = 0;
  try {
    const names = await readdir(dir);
    for (const name of names) {
      if (name.startsWith(".")) continue;
      try {
        const info = await stat(path.join(dir, name));
        if (!info.isFile()) continue;
        uploadFiles += 1;
        uploadBytes += info.size;
      } catch {
        /* skip */
      }
    }
  } catch {
    /* no upload dir */
  }
  return {
    format: BACKUP_FORMAT,
    generatedAt: new Date().toISOString(),
    counts,
    uploadFiles,
    uploadBytes,
  };
}

export async function buildFullBackup(): Promise<{
  filename: string;
  body: string;
  byteLength: number;
}> {
  const generatedAt = new Date();
  const tablePairs = await Promise.all(
    TABLES.map(async ([key, load]) => [key, jsonSafe(await load())] as const),
  );
  const tables = Object.fromEntries(tablePairs);
  const counts = Object.fromEntries(
    tablePairs.map(([key, rows]) => [
      key,
      Array.isArray(rows) ? rows.length : 0,
    ]),
  ) as BackupCounts;
  const uploads = await listUploads();
  const payload = {
    format: BACKUP_FORMAT,
    app: "circle",
    generatedAt: generatedAt.toISOString(),
    counts,
    tables,
    uploads: uploads.files,
  };
  const body = JSON.stringify(payload);
  const p = (n: number) => String(n).padStart(2, "0");
  const filename = `circle-backup-${generatedAt.getFullYear()}${p(generatedAt.getMonth() + 1)}${p(generatedAt.getDate())}-${p(generatedAt.getHours())}${p(generatedAt.getMinutes())}${p(generatedAt.getSeconds())}.json`;
  return { filename, body, byteLength: Buffer.byteLength(body) };
}
