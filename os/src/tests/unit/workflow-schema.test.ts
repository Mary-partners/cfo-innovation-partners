import { describe, expect, it } from "vitest";
import {
  createWorkflowTemplateSchema,
  addTaskTemplateSchema,
  instantiateWorkflowSchema,
} from "@/lib/validation/workflow";

describe("createWorkflowTemplateSchema", () => {
  it("accepts a valid template", () => {
    const result = createWorkflowTemplateSchema.safeParse({
      name: "Monthly Management Accounts",
      description: "",
      serviceBucket: "MONTHLY_CFO",
      recurrence: "MONTHLY",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown recurrence", () => {
    const result = createWorkflowTemplateSchema.safeParse({
      name: "Monthly Management Accounts",
      serviceBucket: "MONTHLY_CFO",
      recurrence: "DAILY",
    });
    expect(result.success).toBe(false);
  });
});

describe("addTaskTemplateSchema", () => {
  it("coerces relativeDueDays and order from form-data strings", () => {
    const result = addTaskTemplateSchema.safeParse({
      title: "Reconcile bank accounts",
      order: "2",
      relativeDueDays: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order).toBe(2);
      expect(result.data.relativeDueDays).toBe(5);
    }
  });

  it("rejects a negative relativeDueDays", () => {
    const result = addTaskTemplateSchema.safeParse({
      title: "Reconcile bank accounts",
      relativeDueDays: "-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("instantiateWorkflowSchema", () => {
  it("coerces a date-input string into a Date", () => {
    const result = instantiateWorkflowSchema.safeParse({
      clientId: "11111111-1111-4111-8111-111111111111",
      workflowTemplateId: "22222222-2222-4222-8222-222222222222",
      periodStart: "2026-03-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.periodStart).toBeInstanceOf(Date);
    }
  });

  it("rejects a non-uuid clientId", () => {
    const result = instantiateWorkflowSchema.safeParse({
      clientId: "not-a-uuid",
      workflowTemplateId: "22222222-2222-2222-2222-222222222222",
      periodStart: "2026-03-01",
    });
    expect(result.success).toBe(false);
  });
});
