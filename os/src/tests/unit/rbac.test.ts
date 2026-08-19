import { describe, expect, it } from "vitest";
import { can, canReview, OrgRole, ROLE_LABELS } from "@/lib/auth/rbac";

describe("rbac.can", () => {
  it("grants Managing Partner every permission in the matrix", () => {
    expect(can(OrgRole.MANAGING_PARTNER, "client:create")).toBe(true);
    expect(can(OrgRole.MANAGING_PARTNER, "billing:view")).toBe(true);
    expect(can(OrgRole.MANAGING_PARTNER, "settings:manage")).toBe(true);
  });

  it("withholds client creation from a Preparer/Analyst", () => {
    expect(can(OrgRole.PREPARER_ANALYST, "client:create")).toBe(false);
    expect(can(OrgRole.PREPARER_ANALYST, "client:view")).toBe(true);
  });

  it("withholds billing visibility from an Independent Reviewer", () => {
    expect(can(OrgRole.INDEPENDENT_REVIEWER, "billing:view")).toBe(false);
  });

  it("grants role management only to Managing Partner and Practice Administrator", () => {
    expect(can(OrgRole.MANAGING_PARTNER, "membership:changeRole")).toBe(true);
    expect(can(OrgRole.PRACTICE_ADMIN, "membership:changeRole")).toBe(true);
    expect(can(OrgRole.PORTFOLIO_LEAD, "membership:changeRole")).toBe(false);
    expect(can(OrgRole.RELATIONSHIP_MANAGER, "membership:changeRole")).toBe(false);
  });

  it("has a human-readable label for every role", () => {
    for (const role of Object.values(OrgRole)) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it("lets a Preparer/Analyst update task status but not manage templates or assign", () => {
    expect(can(OrgRole.PREPARER_ANALYST, "task:updateStatus")).toBe(true);
    expect(can(OrgRole.PREPARER_ANALYST, "workflow:manageTemplates")).toBe(false);
    expect(can(OrgRole.PREPARER_ANALYST, "task:assign")).toBe(false);
  });

  it("lets a Service Lead manage templates, instantiate work, and assign tasks", () => {
    expect(can(OrgRole.SERVICE_LEAD, "workflow:manageTemplates")).toBe(true);
    expect(can(OrgRole.SERVICE_LEAD, "workflow:instantiate")).toBe(true);
    expect(can(OrgRole.SERVICE_LEAD, "task:assign")).toBe(true);
  });

  it("withholds workflow permissions from Finance/Billing and the auditor", () => {
    expect(can(OrgRole.FINANCE_BILLING, "workflow:instantiate")).toBe(false);
    expect(can(OrgRole.READ_ONLY_AUDITOR, "task:updateStatus")).toBe(false);
  });
});

describe("rbac.canReview — segregation of duties", () => {
  it("refuses self-review", () => {
    expect(canReview("membership-1", "membership-1")).toBe(false);
  });

  it("allows review by a different membership", () => {
    expect(canReview("membership-1", "membership-2")).toBe(true);
  });
});
