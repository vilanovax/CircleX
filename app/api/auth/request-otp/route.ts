import { prisma } from "@/lib/db";
import { jsonError, readJson, withDb } from "@/lib/http";
import { isValidIranMobile, normalizePhone } from "@/lib/phone";
import { getAppSettings, otpTtlMs } from "@/lib/app-settings";
import {
  OTP_RESEND_MS,
  generateOtpCode,
  hashOtp,
} from "@/lib/server-auth";
import { sendOtp } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson<{ phone?: string }>(req);
  const phone = normalizePhone(body?.phone ?? "");
  if (!isValidIranMobile(phone)) {
    return jsonError("شماره را با ۰۹ شروع کن — ۱۱ رقم", 400);
  }

  return withDb(async () => {
    const recent = await prisma.otpChallenge.findFirst({
      where: { phoneNormalized: phone },
      orderBy: { createdAt: "desc" },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_MS) {
      return jsonError("کمی صبر کن و دوباره بفرست", 429, "rate_limit");
    }

    const settings = await getAppSettings();
    const code = generateOtpCode();
    await prisma.otpChallenge.create({
      data: {
        phoneNormalized: phone,
        codeHash: hashOtp(phone, code),
        expiresAt: new Date(Date.now() + otpTtlMs(settings.auth.otpTtlMinutes)),
      },
    });
    try {
      await sendOtp(phone, code);
    } catch (err) {
      await prisma.otpChallenge.deleteMany({ where: { phoneNormalized: phone } });
      const reason = err instanceof Error ? err.message : "";
      if (reason === "SMS_NOT_CONFIGURED" || reason === "SMS_NOT_WIRED") {
        return jsonError(
          "ارسال پیامک آماده نیست. بعداً دوباره تلاش کن",
          503,
          "sms_unavailable",
        );
      }
      return jsonError("ارسال کد ممکن نشد", 503, "sms_failed");
    }
    return Response.json({ ok: true });
  });
}
