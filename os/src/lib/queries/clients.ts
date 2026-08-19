import "server-only";

import { db } from "@/lib/db";
import { ClientLifecycleStage } from "@/generated/prisma/enums";

/**
 * Every query in this module takes `organizationId` and filters by it
 * explicitly. This is Phase 0's tenant-isolation boundary; Postgres Row
 * Level Security policies (see /docs/security.md) are the planned
 * defense-in-depth layer once a second organization exists.
 */

export async function getPortfolioStats(organizationId: string) {
  const [total, byLifecycle, bucketCounts] = await Promise.all([
    db.client.count({ where: { organizationId } }),
    db.client.groupBy({
      by: ["lifecycleStage"],
      where: { organizationId },
      _count: { _all: true },
    }),
    db.client.groupBy({
      by: ["serviceBucket"],
      where: { organizationId },
      _count: { _all: true },
    }),
  ]);

  const lifecycleCounts = Object.fromEntries(
    Object.values(ClientLifecycleStage).map((stage) => [stage, 0]),
  ) as Record<ClientLifecycleStage, number>;
  for (const row of byLifecycle) {
    lifecycleCounts[row.lifecycleStage] = row._count._all;
  }

  return {
    total,
    lifecycleCounts,
    activeCount: lifecycleCounts.ACTIVE,
    onboardingCount: lifecycleCounts.ONBOARDING,
    atRiskCount: lifecycleCounts.AT_RISK,
    watchCount: lifecycleCounts.WATCH,
    byServiceBucket: bucketCounts.map((row) => ({
      bucket: row.serviceBucket,
      count: row._count._all,
    })),
  };
}

export async function getClientList(organizationId: string) {
  return db.client.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      portfolioLead: { select: { displayName: true, email: true } },
      relationshipOwner: { select: { displayName: true, email: true } },
    },
  });
}

export async function getClientById(organizationId: string, clientId: string) {
  return db.client.findFirst({
    where: { id: clientId, organizationId },
    include: {
      contacts: true,
      portfolioLead: { select: { displayName: true, email: true } },
      relationshipOwner: { select: { displayName: true, email: true } },
    },
  });
}
