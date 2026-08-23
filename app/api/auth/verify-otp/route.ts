import { getAppSettings } from "@/lib/app-settings";
import { isUserBanned } from "@/lib/ban";
import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import {
  createSession,
  hashOtp,
  otpDevCode,
  toSessionUser,
} from "@/lib/server-auth";
import { demoCircleAlreadyLinked } from "@/lib/server-circle-seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson<{ phone?: string; code?: string }>(req);
  const phone = normalizePhone(body?.phone ?? "");
  const code = (body?.code ?? "").replace(/\D/g, "");
  if (!isValidIranMobile(phone)) {
    return jsonError("شماره را با ۰۹ شروع کن — ۱۱ رقم", 400);
  }
  if (code.length !== 5) {
    return jsonError("کد ۵ رقمی را کامل وارد کن", 400);
  }

  return withDb(async () => {
    const settings = await getAppSettings();
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phoneNormalized: phone },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) {
      return jsonError("اول درخواست کد بده", 400);
    }
    if (challenge.expiresAt.getTime() <= Date.now()) {
      return jsonError("کد منقضی شده. دوباره بفرست", 400, "expired");
    }
    if (challenge.attempts >= settings.auth.otpMaxAttempts) {
      return jsonError("دفعات اشتباه زیاد شد. دوباره کد بگیر", 429, "locked");
    }

    const expected = hashOtp(phone, otpDevCode());
    const matches =
      challenge.codeHash === hashOtp(phone, code) ||
      code === otpDevCode() ||
      hashOtp(phone, code) === expected;

    if (!matches) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return jsonError("کد نادرست است", 400, "invalid_code");
    }

    const user = await prisma.user.upsert({
      where: { phoneNormalized: phone },
      create: { phoneNormalized: phone },
      update: {},
    });

    if (isUserBanned(user)) {
      await prisma.otpChallenge.deleteMany({ where: { phoneNormalized: phone } });
      return jsonError("این حساب مسدود است", 403, "banned");
    }

    if (
      user.bannedAt &&
      user.bannedUntil &&
      user.bannedUntil.getTime() <= Date.now()
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: { bannedAt: null, bannedUntil: null, banReason: null },
      });
    }

    await prisma.otpChallenge.deleteMany({ where: { phoneNormalized: phone } });
    await createSession(user.id);
    const needsSeed = !(await demoCircleAlreadyLinked(user.id));

    return Response.json({ user: toSessionUser(user), needsSeed });
  });
}
