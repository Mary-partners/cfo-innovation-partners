import { OrgRole } from "@/generated/prisma/enums";

export { OrgRole };

/**
 * Permissions actually enforced by the Phase 0/1 slice. This list grows as
 * each subsequent phase ships (billing, quality review, documents, ...) —
 * see /docs/security.md for the full target permission surface and
 * /docs/implementation-plan.md for what unlocks each one.
 */
export type Permission =
  | "client:view"
  | "client:create"
  | "client:edit"
  | "membership:view"
  | "membership:changeRole"
  | "membership:deactivate"
  | "audit:view"
  | "settings:manage"
  | "billing:view" // gated now; billing module ships Phase 3
  | "workflow:manageTemplates"
  | "workflow:instantiate"
  | "task:updateStatus"
  | "task:assign";

const ALL_INTERNAL_PERMISSIONS: Permission[] = [
  "client:view",
  "client:create",
  "client:edit",
  "membership:view",
  "membership:changeRole",
  "membership:deactivate",
  "audit:view",
  "settings:manage",
  "billing:view",
  "workflow:manageTemplates",
  "workflow:instantiate",
  "task:updateStatus",
  "task:assign",
];

/**
 * Authority matrix — mirrors the "Core authority" column of the roles table
 * in the product spec. Financial/commercial permissions (billing:view) are
 * intentionally withheld from roles the spec marks as not needing them
 * (Preparer/Analyst, Independent Reviewer, Read-only/Auditor).
 */
const ROLE_PERMISSIONS: Record<OrgRole, ReadonlySet<Permission>> = {
  [OrgRole.MANAGING_PARTNER]: new Set(ALL_INTERNAL_PERMISSIONS),
  [OrgRole.PRACTICE_ADMIN]: new Set([
    "client:view",
    "client:create",
    "client:edit",
    "membership:view",
    "membership:changeRole",
    "membership:deactivate",
    "audit:view",
    "settings:manage",
    "workflow:manageTemplates",
    "workflow:instantiate",
  ]),
  [OrgRole.PORTFOLIO_LEAD]: new Set([
    "client:view",
    "client:create",
    "client:edit",
    "membership:view",
    "billing:view",
    "workflow:instantiate",
    "task:updateStatus",
    "task:assign",
  ]),
  [OrgRole.RELATIONSHIP_MANAGER]: new Set([
    "client:view",
    "client:edit",
    "membership:view",
  ]),
  [OrgRole.SERVICE_LEAD]: new Set([
    "client:view",
    "client:edit",
    "membership:view",
    "workflow:manageTemplates",
    "workflow:instantiate",
    "task:updateStatus",
    "task:assign",
  ]),
  [OrgRole.PREPARER_ANALYST]: new Set(["client:view", "task:updateStatus"]),
  [OrgRole.INDEPENDENT_REVIEWER]: new Set(["client:view"]),
  [OrgRole.FINANCE_BILLING]: new Set(["client:view", "billing:view"]),
  [OrgRole.READ_ONLY_AUDITOR]: new Set(["client:view", "audit:view"]),
};

export function can(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function requirePermission(role: OrgRole, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(
      `Forbidden: role ${role} does not have permission "${permission}".`,
    );
  }
}

export const ROLE_LABELS: Record<OrgRole, string> = {
  [OrgRole.MANAGING_PARTNER]: "Managing Partner",
  [OrgRole.PRACTICE_ADMIN]: "Practice Administrator",
  [OrgRole.PORTFOLIO_LEAD]: "Portfolio Lead / CFO",
  [OrgRole.RELATIONSHIP_MANAGER]: "Client Relationship Manager",
  [OrgRole.SERVICE_LEAD]: "Service Lead",
  [OrgRole.PREPARER_ANALYST]: "Preparer / Analyst",
  [OrgRole.INDEPENDENT_REVIEWER]: "Independent Reviewer",
  [OrgRole.FINANCE_BILLING]: "Finance / Billing",
  [OrgRole.READ_ONLY_AUDITOR]: "Read-only / Auditor",
};

/**
 * Segregation of duties: a reviewer must never be the same person who
 * prepared the work they're reviewing. The Quality module (Phase 2) will
 * call this at the deliverable-review layer; kept here now so the rule
 * lives in one place from day one.
 */
export function canReview(preparerMembershipId: string, reviewerMembershipId: string): boolean {
  return preparerMembershipId !== reviewerMembershipId;
}
