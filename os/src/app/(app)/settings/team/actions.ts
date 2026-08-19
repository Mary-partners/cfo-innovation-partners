"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { can, OrgRole } from "@/lib/auth/rbac";
import { recordAuditEvent } from "@/lib/audit";

const changeRoleSchema = z.object({
  membershipId: z.uuid(),
  role: z.enum(OrgRole),
});

export type ChangeRoleState = { error?: string };

export async function changeMemberRoleAction(
  _prevState: ChangeRoleState,
  formData: FormData,
): Promise<ChangeRoleState> {
  const actor = await requireActor();

  if (!can(actor.membership.role, "membership:changeRole")) {
    return { error: "You don't have permission to change roles." };
  }

  const parsed = changeRoleSchema.safeParse({
    membershipId: formData.get("membershipId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const target = await db.membership.findFirst({
    where: { id: parsed.data.membershipId, organizationId: actor.organizationId },
  });
  if (!target) {
    return { error: "Member not found." };
  }

  const previousRole = target.role;
  await db.membership.update({
    where: { id: target.id },
    data: { role: parsed.data.role },
  });

  await recordAuditEvent({
    organizationId: actor.organizationId,
    actorMembershipId: actor.membership.id,
    action: "MEMBERSHIP_ROLE_CHANGED",
    targetType: "Membership",
    targetId: target.id,
    metadata: { from: previousRole, to: parsed.data.role },
  });

  revalidatePath("/settings/team");
  return {};
}
