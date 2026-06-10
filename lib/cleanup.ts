import cron from "node-cron";
import { prisma } from "@/lib/prisma";

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

async function cleanupInactiveUsers() {
  try {
    const twoYearsAgo = new Date(Date.now() - TWO_YEARS_MS);

    const deleted = await prisma.user.deleteMany({
      where: {
        lastLogin: {
          lt: twoYearsAgo,
        },
      },
    });

    console.log(`[Cleanup] ${deleted.count} inaktif hesap silindi`);
  } catch (err) {
    console.error("[Cleanup Error]", err);
  }
}

export function startCleanupSchedule() {
  // Her gün saat 02:00'de çalış
  cron.schedule("0 2 * * *", cleanupInactiveUsers, {
    timezone: "UTC",
  });

  console.log("[Scheduler] 2 yıllık inaktivite cleanup başladı");
}
