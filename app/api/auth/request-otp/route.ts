import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import {
  OTP_RESEND_MS,
  OTP_TTL_MS,
  hashOtp,
  otpDevCode,
} from "@/lib/server-auth";
import { sendOtp } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson<{ phone?: string }>(req);
  const phone = normalizePhone(body?.phone ?? "");
  if (!isValidIranMobile(phone)) {
    return jsonError("شماره را با ۰۹ شروع کنید — ۱۱ رقم", 400);
  }

  const recent = await prisma.otpChallenge.findFirst({
    where: { phoneNormalized: phone },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_MS) {
    return jsonError("کمی صبر کن و دوباره بفرست", 429, "rate_limit");
  }

  const code = otpDevCode();
  await prisma.otpChallenge.create({
    data: {
      phoneNormalized: phone,
      codeHash: hashOtp(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  await sendOtp(phone, code);
  return Response.json({ ok: true });
}
