"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { recordAuditEvent } from "@/lib/audit";
import { createClientSchema } from "@/lib/validation/client";

export type CreateClientState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData,
): Promise<CreateClientState> {
  const actor = await requireActor();

  if (!can(actor.membership.role, "client:create")) {
    return { error: "You don't have permission to create clients." };
  }

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country"),
    currency: formData.get("currency"),
    serviceBucket: formData.get("serviceBucket"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const client = await db.client.create({
    data: {
      organizationId: actor.organizationId,
      name: parsed.data.name,
      country: parsed.data.country,
      currency: parsed.data.currency,
      serviceBucket: parsed.data.serviceBucket,
      lifecycleStage: "PROSPECT",
      relationshipOwnerId: actor.membership.id,
    },
  });

  await recordAuditEvent({
    organizationId: actor.organizationId,
    actorMembershipId: actor.membership.id,
    action: "CLIENT_CREATED",
    targetType: "Client",
    targetId: client.id,
    metadata: { name: client.name, serviceBucket: client.serviceBucket },
  });

  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return {};
}
