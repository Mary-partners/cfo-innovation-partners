import "server-only";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { OrgRole } from "@/lib/auth/rbac";
import { recordAuditEvent } from "@/lib/audit";

export const DEFAULT_ORG_SLUG = "cfoip";

/**
 * CFOIP runs a single practice tenant today. This resolves (and, on first
 * boot, creates) that one Organization row. See /docs/decision-log.md —
 * "Single-tenant bootstrap" — for why the schema stays multi-tenant-shaped
 * while the product only exposes one org.
 */
async function getOrCreateDefaultOrganization() {
  return db.organization.upsert({
    where: { slug: DEFAULT_ORG_SLUG },
    update: {},
    create: {
      slug: DEFAULT_ORG_SLUG,
      name: "CFO Innovation Partners",
      currency: "KES",
      timezone: "Africa/Nairobi",
    },
  });
}

export type CurrentActor = {
  userId: string;
  email: string;
  membership: {
    id: string;
    role: OrgRole;
    isActive: boolean;
  };
  organizationId: string;
};

/**
 * Resolves the signed-in Supabase user to an internal Membership, creating
 * one on first sign-in. The first person ever to sign in to a fresh
 * organization becomes Managing Partner; every subsequent sign-in defaults
 * to Preparer/Analyst until a Managing Partner or Practice Administrator
 * promotes them from Settings -> Team. This keeps the "log in or create an
 * account" flow self-serve without an open invite/admin bootstrap problem.
 */
export async function getOrCreateCurrentActor(): Promise<CurrentActor | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const organization = await getOrCreateDefaultOrganization();

  let membership = await db.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    const existingMemberCount = await db.membership.count({
      where: { organizationId: organization.id },
    });
    const role = existingMemberCount === 0 ? OrgRole.MANAGING_PARTNER : OrgRole.PREPARER_ANALYST;

    membership = await db.membership.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        email: user.email,
        displayName: (user.user_metadata?.full_name as string | undefined) ?? null,
        role,
      },
    });

    await recordAuditEvent({
      organizationId: organization.id,
      actorMembershipId: membership.id,
      action: "USER_SIGNED_UP",
      targetType: "Membership",
      targetId: membership.id,
      metadata: { role },
    });
  }

  return {
    userId: user.id,
    email: user.email,
    organizationId: organization.id,
    membership: {
      id: membership.id,
      role: membership.role,
      isActive: membership.isActive,
    },
  };
}

/** Server Component / Server Action guard: redirects to /login if signed out. */
export async function requireActor(): Promise<CurrentActor> {
  const actor = await getOrCreateCurrentActor();
  if (!actor) {
    redirect("/login");
  }
  return actor;
}
