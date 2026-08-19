import { z } from "zod";
import { ServiceBucket, RecurrenceType, TaskStatus } from "@/generated/prisma/enums";

export const createWorkflowTemplateSchema = z.object({
  name: z.string().trim().min(2, "Give the template a name"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  serviceBucket: z.enum(ServiceBucket, { error: "Choose a service portfolio bucket" }),
  recurrence: z.enum(RecurrenceType, { error: "Choose how often this recurs" }),
});

export const addTaskTemplateSchema = z.object({
  title: z.string().trim().min(2, "Give the task a title"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  relativeDueDays: z.coerce
    .number()
    .int()
    .min(0, "Must be 0 or more days into the period"),
});

export const instantiateWorkflowSchema = z.object({
  clientId: z.uuid(),
  workflowTemplateId: z.uuid(),
  periodStart: z.coerce.date(),
});

export const updateTaskStatusSchema = z.object({
  taskId: z.uuid(),
  status: z.enum(TaskStatus),
});

export const assignTaskSchema = z.object({
  taskId: z.uuid(),
  assigneeMembershipId: z.uuid().nullable(),
});
