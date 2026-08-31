import { allowDevOtp } from "@/lib/server-auth";

/**
 * SMS port. In production a real panel must deliver the code — never log OTP.
 * Dev / OTP_ALLOW_DEV logs the code so local login still works.
 */
export async function sendOtp(phone: string, code: string): Promise<void> {
  if (allowDevOtp()) {
    console.info(`[sms:mock] OTP for ${phone}: ${code}`);
    return;
  }

  const key = process.env.KAVENEGAR_API_KEY?.trim();
  if (!key) {
    throw new Error("SMS_NOT_CONFIGURED");
  }

  // Panel wiring: replace with Kavenegar verify/lookup call.
  // Until wired, refuse rather than pretend delivery succeeded.
  console.error(
    `[sms] KAVENEGAR_API_KEY is set but sender is not wired yet (${phone})`,
  );
  throw new Error("SMS_NOT_WIRED");
}
