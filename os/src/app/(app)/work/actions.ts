"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActor } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { recordAuditEvent } from "@/lib/audit";
import {
  instantiateWorkflowSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
} from "@/lib/validation/workflow";
import { computePeriodEnd, computeTaskDueDate } from "@/lib/workflow/period";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> };

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

export async function instantiateWorkflowAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor();
  if (!can(actor.membership.role, "workflow:instantiate")) {
    return { error: "You don't have permission to start new work." };
  }

  const parsed = instantiateWorkflowSchema.safeParse({
    clientId: formData.get("clientId"),
    workflowTemplateId: formData.get("workflowTemplateId"),
    periodStart: formData.get("periodStart"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const [client, template] = await Promise.all([
    db.client.findFirst({
      where: { id: parsed.data.clientId, organizationId: actor.organizationId },
    }),
    db.workflowTemplate.findFirst({
      where: { id: parsed.data.workflowTemplateId, organizationId: actor.organizationId },
      include: { taskTemplates: true },
    }),
  ]);
  if (!client) return { error: "Client not found." };
  if (!template) return { error: "Workflow template not found." };

  const periodStart = parsed.data.periodStart;
  const periodEnd = computePeriodEnd(periodStart, template.recurrence);

  const instance = await db.workflowInstance.create({
    data: {
      organizationId: actor.organizationId,
      clientId: client.id,
      workflowTemplateId: template.id,
      name: template.name,
      serviceBucket: template.serviceBucket,
      periodStart,
      periodEnd,
      tasks: {
        create: template.taskTemplates.map((tt) => ({
          title: tt.title,
          description: tt.description,
          order: tt.order,
          dueDate: computeTaskDueDate(periodStart, tt.relativeDueDays),
        })),
      },
    },
  });

  await recordAuditEvent({
    organizationId: actor.organizationId,
    actorMembershipId: actor.membership.id,
    action: "WORKFLOW_INSTANTIATED",
    targetType: "WorkflowInstance",
    targetId: instance.id,
    metadata: { clientId: client.id, templateId: template.id, taskCount: template.taskTemplates.length },
  });

  revalidatePath("/work");
  revalidatePath("/calendar");
  revalidatePath(`/clients/${client.id}`);
  redirect(`/work/${instance.id}`);
}

export async function updateTaskStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor();
  if (!can(actor.membership.role, "task:updateStatus")) {
    return { error: "You don't have permission to update task status." };
  }

  const parsed = updateTaskStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const task = await db.task.findFirst({
    where: {
      id: parsed.data.taskId,
      workflowInstance: { organizationId: actor.organizationId },
    },
    include: { workflowInstance: true },
  });
  if (!task) return { error: "Task not found." };

  await db.task.update({
    where: { id: task.id },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "DELIVERED" ? new Date() : null,
    },
  });

  await recordAuditEvent({
    organizationId: actor.organizationId,
    actorMembershipId: actor.membership.id,
    action: "TASK_STATUS_CHANGED",
    targetType: "Task",
    targetId: task.id,
    metadata: { from: task.status, to: parsed.data.status },
  });

  revalidatePath(`/work/${task.workflowInstanceId}`);
  revalidatePath("/work");
  revalidatePath("/calendar");
  return {};
}

export async function assignTaskAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireActor();
  if (!can(actor.membership.role, "task:assign")) {
    return { error: "You don't have permission to assign tasks." };
  }

  const rawAssignee = formData.get("assigneeMembershipId");
  const parsed = assignTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    assigneeMembershipId: rawAssignee === "" ? null : rawAssignee,
  });
  if (!parsed.success) return { error: "Invalid request." };

  const task = await db.task.findFirst({
    where: {
      id: parsed.data.taskId,
      workflowInstance: { organizationId: actor.organizationId },
    },
  });
  if (!task) return { error: "Task not found." };

  if (parsed.data.assigneeMembershipId) {
    const member = await db.membership.findFirst({
      where: { id: parsed.data.assigneeMembershipId, organizationId: actor.organizationId },
    });
    if (!member) return { error: "Member not found." };
  }

  await db.task.update({
    where: { id: task.id },
    data: { assigneeMembershipId: parsed.data.assigneeMembershipId },
  });

  await recordAuditEvent({
    organizationId: actor.organizationId,
    actorMembershipId: actor.membership.id,
    action: "TASK_ASSIGNED",
    targetType: "Task",
    targetId: task.id,
    metadata: { assigneeMembershipId: parsed.data.assigneeMembershipId },
  });

  revalidatePath(`/work/${task.workflowInstanceId}`);
  return {};
}
