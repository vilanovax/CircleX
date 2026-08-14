import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import {
  OTP_MAX_ATTEMPTS,
  createSession,
  hashOtp,
  otpDevCode,
  toSessionUser,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson<{ phone?: string; code?: string }>(req);
  const phone = normalizePhone(body?.phone ?? "");
  const code = (body?.code ?? "").replace(/\D/g, "");
  if (!isValidIranMobile(phone)) {
    return jsonError("شماره را با ۰۹ شروع کنید — ۱۱ رقم", 400);
  }
  if (code.length !== 5) {
    return jsonError("کد ۵ رقمی را کامل وارد کنید", 400);
  }

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
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
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

  await prisma.otpChallenge.deleteMany({ where: { phoneNormalized: phone } });
  await createSession(user.id);

  return Response.json({ user: toSessionUser(user) });
}
