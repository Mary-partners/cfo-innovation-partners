import "server-only";

import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/generated/prisma/enums";

type RecordAuditEventInput = {
  organizationId: string;
  actorMembershipId?: string | null;
  actorLabel?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Writes one row to the append-only audit trail. Never update or delete
 * AuditEvent rows from application code — see /docs/security.md.
 */
export async function recordAuditEvent(input: RecordAuditEventInput) {
  return db.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      actorMembershipId: input.actorMembershipId ?? null,
      actorLabel: input.actorLabel ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata,
    },
  });
}
