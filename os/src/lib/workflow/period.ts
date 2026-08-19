import type { RecurrenceType } from "@/generated/prisma/enums";

/**
 * Given a period start and how a WorkflowTemplate recurs, returns the
 * natural calendar period end. All math is done in UTC calendar terms — a
 * known simplification (see /docs/decision-log.md): it doesn't yet account
 * for the organization's configured timezone shifting which *local* day a
 * UTC-midnight boundary falls on. Fine for Africa/Nairobi (UTC+3, no DST);
 * revisit if CFOIP ever serves a client whose reporting calendar depends on
 * a timezone far enough from UTC for that to matter.
 */
export function computePeriodEnd(periodStart: Date, recurrence: RecurrenceType): Date {
  const start = new Date(periodStart);

  switch (recurrence) {
    case "ONE_OFF":
      return start;
    case "WEEKLY": {
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 6);
      return end;
    }
    case "MONTHLY":
      // Day 0 of "next month" is the last day of this month.
      return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    case "QUARTERLY": {
      const quarterStartMonth = Math.floor(start.getUTCMonth() / 3) * 3;
      return new Date(Date.UTC(start.getUTCFullYear(), quarterStartMonth + 3, 0));
    }
    case "ANNUAL":
      return new Date(Date.UTC(start.getUTCFullYear(), 11, 31));
  }
}

/** `relativeDueDays` is days after the owning WorkflowInstance's periodStart. */
export function computeTaskDueDate(periodStart: Date, relativeDueDays: number): Date {
  const due = new Date(periodStart);
  due.setUTCDate(due.getUTCDate() + relativeDueDays);
  return due;
}

export const RECURRENCE_LABEL: Record<RecurrenceType, string> = {
  ONE_OFF: "One-off",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
};
