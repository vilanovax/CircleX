import { backfillAllSeedTehranAreas } from "../lib/seed-tehran-area";
import { prisma } from "../lib/db";

async function main() {
  const result = await backfillAllSeedTehranAreas();
  console.log(
    `Tehran hoods: ${result.hoods}. Seed listings: ${result.listings}, wants: ${result.wants}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
