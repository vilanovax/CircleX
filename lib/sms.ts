/**
 * SMS port. Mock logs the code until a panel key is set.
 * Swap the body later — LoginGate and OTP routes stay the same.
 */
export async function sendOtp(phone: string, code: string): Promise<void> {
  const key = process.env.KAVENEGAR_API_KEY?.trim();
  if (key) {
    // Panel wiring comes in a later cut.
    console.info(`[sms] KAVENEGAR_API_KEY present but sender not wired yet (${phone})`);
  }
  console.info(`[sms:mock] OTP for ${phone}: ${code}`);
}
