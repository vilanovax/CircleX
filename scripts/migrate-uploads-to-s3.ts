/**
 * Migrate legacy `/api/uploads/….jpg` refs in Postgres → Pars Pack (S3).
 *
 * Reads files from local UPLOAD_DIR (default ./uploads), puts them at
 * `uploads/<filename>` on the bucket, then rewrites DB fields to the public URL.
 *
 * Usage:
 *   npx tsx scripts/migrate-uploads-to-s3.ts          # dry-run
 *   npx tsx scripts/migrate-uploads-to-s3.ts --apply  # upload + rewrite DB
 */
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { UPLOAD_PATH_RE } from "../lib/media";
import {
  isObjectStorageConfigured,
  publicObjectUrl,
  putPublicJpeg,
} from "../lib/object-storage";

const APPLY = process.argv.includes("--apply");
const FILE_RE = /^[a-zA-Z0-9._-]+\.jpe?g$/i;

const prisma = new PrismaClient();

function uploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "uploads");
}

function extractUploadName(value: string): string | null {
  const v = value.trim();
  const m = v.match(/\/api\/uploads\/([a-zA-Z0-9._-]+\.jpe?g)/i);
  if (m?.[1] && FILE_RE.test(m[1])) return m[1];
  if (UPLOAD_PATH_RE.test(v)) {
    const base = v.split("/").pop();
    return base && FILE_RE.test(base) ? base : null;
  }
  return null;
}

function rewriteValue(
  value: string,
  urlByName: Map<string, string>,
): string {
  const name = extractUploadName(value);
  if (!name) return value;
  return urlByName.get(name) ?? value;
}

async function collectReferencedNames(): Promise<Set<string>> {
  const names = new Set<string>();
  const add = (v: string | null | undefined) => {
    if (!v) return;
    const name = extractUploadName(v);
    if (name) names.add(name);
  };

  const listings = await prisma.marketListing.findMany({
    select: { image: true, images: true },
  });
  for (const row of listings) {
    add(row.image);
    for (const img of row.images) add(img);
  }

  const users = await prisma.user.findMany({
    where: { avatar: { contains: "/api/uploads/" } },
    select: { avatar: true },
  });
  for (const row of users) add(row.avatar);

  const messages = await prisma.directMessage.findMany({
    where: { imageUrl: { contains: "/api/uploads/" } },
    select: { imageUrl: true },
  });
  for (const row of messages) add(row.imageUrl);

  const requests = await prisma.wantRequest.findMany({
    where: { image: { contains: "/api/uploads/" } },
    select: { image: true },
  });
  for (const row of requests) add(row.image);

  const events = await prisma.gathering.findMany({
    where: { image: { contains: "/api/uploads/" } },
    select: { image: true },
  });
  for (const row of events) add(row.image);

  return names;
}

async function rewriteDatabase(urlByName: Map<string, string>): Promise<{
  listings: number;
  users: number;
  messages: number;
  requests: number;
  events: number;
}> {
  let listings = 0;
  let users = 0;
  let messages = 0;
  let requests = 0;
  let events = 0;

  const listingRows = await prisma.marketListing.findMany({
    select: { id: true, image: true, images: true },
  });
  for (const row of listingRows) {
    const image = rewriteValue(row.image, urlByName);
    const images = row.images.map((v) => rewriteValue(v, urlByName));
    const changed =
      image !== row.image || images.some((v, i) => v !== row.images[i]);
    if (!changed) continue;
    if (APPLY) {
      await prisma.marketListing.update({
        where: { id: row.id },
        data: { image, images },
      });
    }
    listings += 1;
    console.log(
      APPLY ? "listing updated" : "listing would update",
      row.id,
      "→",
      image,
    );
  }

  const userRows = await prisma.user.findMany({
    where: { avatar: { contains: "/api/uploads/" } },
    select: { id: true, avatar: true },
  });
  for (const row of userRows) {
    const avatar = rewriteValue(row.avatar, urlByName);
    if (avatar === row.avatar) continue;
    if (APPLY) {
      await prisma.user.update({
        where: { id: row.id },
        data: { avatar },
      });
    }
    users += 1;
  }

  const messageRows = await prisma.directMessage.findMany({
    where: { imageUrl: { contains: "/api/uploads/" } },
    select: { id: true, imageUrl: true },
  });
  for (const row of messageRows) {
    if (!row.imageUrl) continue;
    const imageUrl = rewriteValue(row.imageUrl, urlByName);
    if (imageUrl === row.imageUrl) continue;
    if (APPLY) {
      await prisma.directMessage.update({
        where: { id: row.id },
        data: { imageUrl },
      });
    }
    messages += 1;
  }

  const requestRows = await prisma.wantRequest.findMany({
    where: { image: { contains: "/api/uploads/" } },
    select: { id: true, image: true },
  });
  for (const row of requestRows) {
    const image = rewriteValue(row.image, urlByName);
    if (image === row.image) continue;
    if (APPLY) {
      await prisma.wantRequest.update({
        where: { id: row.id },
        data: { image },
      });
    }
    requests += 1;
  }

  const eventRows = await prisma.gathering.findMany({
    where: { image: { contains: "/api/uploads/" } },
    select: { id: true, image: true },
  });
  for (const row of eventRows) {
    const image = rewriteValue(row.image, urlByName);
    if (image === row.image) continue;
    if (APPLY) {
      await prisma.gathering.update({
        where: { id: row.id },
        data: { image },
      });
    }
    events += 1;
  }

  return { listings, users, messages, requests, events };
}

async function main() {
  if (!isObjectStorageConfigured()) {
    throw new Error(
      "S3 env ناقص است (S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY / S3_SECRET_KEY)",
    );
  }

  const dir = uploadDir();
  console.log(
    APPLY
      ? "MODE: apply (آپلود + به‌روزرسانی DB)"
      : "MODE: dry-run (بدون --apply چیزی نوشته نمی‌شود)",
  );
  console.log("UPLOAD_DIR:", dir);

  const referenced = await collectReferencedNames();
  console.log("referenced /api/uploads files:", referenced.size);

  let diskNames: string[] = [];
  try {
    diskNames = (await readdir(dir)).filter((n) => FILE_RE.test(n));
  } catch {
    diskNames = [];
  }
  console.log("local jpeg files:", diskNames.length);

  /** Only migrate files still referenced in DB (plus ensure those files exist). */
  const urlByName = new Map<string, string>();
  const missing: string[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const name of Array.from(referenced).sort()) {
    const full = path.join(dir, name);
    const targetUrl = publicObjectUrl(`uploads/${name}`);
    if (!existsSync(full)) {
      missing.push(name);
      console.log("missing", name);
      continue;
    }

    if (!APPLY) {
      urlByName.set(name, targetUrl);
      console.log("would upload", name, "→", targetUrl);
      continue;
    }

    try {
      const body = await readFile(full);
      const url = await putPublicJpeg(`uploads/${name}`, body);
      urlByName.set(name, url);
      console.log("uploaded", name, "→", url);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      failed.push({ name, error });
      console.log("fail", name, "—", error);
    }
  }

  const orphanLocal = diskNames.filter((n) => !referenced.has(n));
  if (orphanLocal.length) {
    console.log(
      "local files not referenced in DB (skipped):",
      orphanLocal.length,
      orphanLocal,
    );
  }

  const rewritten = await rewriteDatabase(urlByName);

  console.log("\n--- summary ---");
  console.log("mapped:", urlByName.size);
  console.log("missing local (still in DB):", missing.length, missing);
  console.log("failed:", failed.length, failed);
  console.log("rows:", rewritten);
  if (!APPLY) {
    console.log("\nبرای اعمال: npm run migrate:uploads -- --apply");
  } else {
    console.log("done.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
