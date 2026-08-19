import { describe, expect, it, vi } from "vitest";
import { computeIsOverdue, computeWorkflowProgress } from "@/lib/workflow/status";

describe("computeIsOverdue", () => {
  it("is true for a past due date on an undelivered task", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(computeIsOverdue({ status: "IN_PROGRESS", dueDate: yesterday })).toBe(true);
  });

  it("is false for a future due date", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(computeIsOverdue({ status: "NOT_STARTED", dueDate: tomorrow })).toBe(false);
  });

  it("is false once delivered, even past due", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(computeIsOverdue({ status: "DELIVERED", dueDate: yesterday })).toBe(false);
  });

  it("clears the moment a task is marked delivered — not sticky", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const task = { status: "BLOCKED" as const, dueDate: yesterday };
    expect(computeIsOverdue(task)).toBe(true);
    const delivered = { ...task, status: "DELIVERED" as const };
    expect(computeIsOverdue(delivered)).toBe(false);
  });
});

describe("computeWorkflowProgress", () => {
  it("is 0 for a workflow with no tasks", () => {
    expect(computeWorkflowProgress([])).toBe(0);
  });

  it("is 0 when nothing is delivered", () => {
    expect(
      computeWorkflowProgress([{ status: "NOT_STARTED" }, { status: "IN_PROGRESS" }]),
    ).toBe(0);
  });

  it("is 100 when everything is delivered", () => {
    expect(computeWorkflowProgress([{ status: "DELIVERED" }, { status: "DELIVERED" }])).toBe(100);
  });

  it("rounds to the nearest percent for a partial mix", () => {
    // 1 of 3 delivered = 33.33...% -> rounds to 33
    expect(
      computeWorkflowProgress([
        { status: "DELIVERED" },
        { status: "IN_PROGRESS" },
        { status: "NOT_STARTED" },
      ]),
    ).toBe(33);
  });
});

// Guard against the module-level Date.now() footgun this codebase avoids in
// Workflow-tool scripts (irrelevant here) but is still worth pinning: these
// functions must read the clock at call time, not import time.
describe("computeIsOverdue reacts to a mocked clock", () => {
  it("flips as soon as `now` passes the due date", () => {
    const due = new Date("2026-06-15T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-14T00:00:00.000Z"));
    expect(computeIsOverdue({ status: "IN_PROGRESS", dueDate: due })).toBe(false);
    vi.setSystemTime(new Date("2026-06-16T00:00:00.000Z"));
    expect(computeIsOverdue({ status: "IN_PROGRESS", dueDate: due })).toBe(true);
    vi.useRealTimers();
  });
});
