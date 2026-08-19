import { describe, expect, it } from "vitest";
import { computePeriodEnd, computeTaskDueDate } from "@/lib/workflow/period";

describe("computePeriodEnd", () => {
  it("ONE_OFF: period end equals period start", () => {
    const start = new Date(Date.UTC(2026, 2, 1));
    expect(computePeriodEnd(start, "ONE_OFF").getTime()).toBe(start.getTime());
  });

  it("WEEKLY: 6 days after the start", () => {
    const start = new Date(Date.UTC(2026, 2, 2)); // Mon 2 Mar 2026
    const end = computePeriodEnd(start, "WEEKLY");
    expect(end.toISOString().slice(0, 10)).toBe("2026-03-08");
  });

  it("MONTHLY: last day of the start's month, including a 31-day month", () => {
    const start = new Date(Date.UTC(2026, 2, 1)); // 1 Mar 2026
    const end = computePeriodEnd(start, "MONTHLY");
    expect(end.toISOString().slice(0, 10)).toBe("2026-03-31");
  });

  it("MONTHLY: correctly handles February in a non-leap year", () => {
    const start = new Date(Date.UTC(2026, 1, 1)); // 1 Feb 2026 (not a leap year)
    const end = computePeriodEnd(start, "MONTHLY");
    expect(end.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("QUARTERLY: last day of the quarter containing the start", () => {
    // 15 Feb falls in Q1 (Jan-Mar) -> should end 31 Mar
    const start = new Date(Date.UTC(2026, 1, 15));
    const end = computePeriodEnd(start, "QUARTERLY");
    expect(end.toISOString().slice(0, 10)).toBe("2026-03-31");
  });

  it("QUARTERLY: a start in Q4 ends 31 Dec", () => {
    const start = new Date(Date.UTC(2026, 10, 3)); // 3 Nov 2026 -> Q4
    const end = computePeriodEnd(start, "QUARTERLY");
    expect(end.toISOString().slice(0, 10)).toBe("2026-12-31");
  });

  it("ANNUAL: 31 Dec of the start's year", () => {
    const start = new Date(Date.UTC(2026, 5, 15));
    const end = computePeriodEnd(start, "ANNUAL");
    expect(end.toISOString().slice(0, 10)).toBe("2026-12-31");
  });
});

describe("computeTaskDueDate", () => {
  it("adds relativeDueDays to the period start", () => {
    const start = new Date(Date.UTC(2026, 2, 1));
    const due = computeTaskDueDate(start, 5);
    expect(due.toISOString().slice(0, 10)).toBe("2026-03-06");
  });

  it("relativeDueDays of 0 means due on the period start", () => {
    const start = new Date(Date.UTC(2026, 2, 1));
    const due = computeTaskDueDate(start, 0);
    expect(due.getTime()).toBe(start.getTime());
  });

  it("correctly rolls over a month boundary", () => {
    const start = new Date(Date.UTC(2026, 2, 28)); // 28 Mar 2026
    const due = computeTaskDueDate(start, 5);
    expect(due.toISOString().slice(0, 10)).toBe("2026-04-02");
  });
});
