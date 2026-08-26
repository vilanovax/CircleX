import { backfillAllSeedTehranAreas } from "@/lib/seed-tehran-area";
import { seedFamilyCircle } from "@/lib/server-family-seed";

export { demoCircleAlreadyLinked } from "@/lib/server-demo-circle-seed";

/** Family invite catalog only — never the demo marketplace. */
export async function seedCircleForUser(userId: string, phone: string) {
  await seedFamilyCircle(userId, phone);
  await backfillAllSeedTehranAreas();
}
