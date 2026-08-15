import { seedDemoCircle } from "@/lib/server-demo-circle-seed";
import { seedFamilyCircle } from "@/lib/server-family-seed";

/** Idempotent demo + family catalog. Call on login / family invite — not on every GET. */
export async function seedCircleForUser(userId: string, phone: string) {
  await seedFamilyCircle(userId, phone);
  await seedDemoCircle(userId, phone);
}
