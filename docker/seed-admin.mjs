import { randomBytes, scryptSync } from "crypto";
import { PrismaClient } from "@prisma/client";

const KEYLEN = 64;
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function normalizeAdminEmail(raw) {
  return raw.trim().toLowerCase();
}

function isValidAdminEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function main() {
  const emailRaw = process.env.ADMIN_EMAIL?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "مدیر سیرکل";

  if (!emailRaw || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD unset — skip admin seed.");
    return;
  }

  const email = normalizeAdminEmail(emailRaw);
  if (!isValidAdminEmail(email)) {
    console.error("ADMIN_EMAIL is not a valid email — skip admin seed.");
    return;
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters — skip admin seed.");
    return;
  }

  const existing = await prisma.adminUser.findFirst({
    select: { id: true, email: true },
  });
  if (existing) {
    console.log(`Admin already exists (${existing.email}). Seed skipped.`);
    return;
  }

  const admin = await prisma.adminUser.create({
    data: {
      email,
      name,
      passwordHash: hashPassword(password),
      role: "superadmin",
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`Created superadmin ${admin.email} (${admin.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
