import { PrismaClient } from "@prisma/client";
import { hashPassword, isValidAdminEmail, normalizeAdminEmail } from "../lib/admin-password";

const prisma = new PrismaClient();

async function main() {
  const emailRaw = process.env.ADMIN_EMAIL?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "مدیر سیرکل";

  if (!emailRaw || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.");
    process.exit(1);
  }

  const email = normalizeAdminEmail(emailRaw);
  if (!isValidAdminEmail(email)) {
    console.error("ADMIN_EMAIL is not a valid email.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const existing = await prisma.adminUser.findFirst({ select: { id: true, email: true } });
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
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
