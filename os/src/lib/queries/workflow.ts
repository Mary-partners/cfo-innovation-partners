import "server-only";

import { db } from "@/lib/db";

/** Every query here takes organizationId and filters by it — see the note
 * at the top of src/lib/queries/clients.ts for what this is and isn't. */

export async function getWorkflowTemplates(organizationId: string) {
  return db.workflowTemplate.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { taskTemplates: { orderBy: { order: "asc" } } },
  });
}

export async function getWorkflowTemplateById(organizationId: string, id: string) {
  return db.workflowTemplate.findFirst({
    where: { id, organizationId },
    include: { taskTemplates: { orderBy: { order: "asc" } } },
  });
}

export async function getActiveWorkflowTemplates(organizationId: string) {
  return db.workflowTemplate.findMany({
    where: { organizationId, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getWorkflowInstances(organizationId: string) {
  return db.workflowInstance.findMany({
    where: { organizationId },
    orderBy: { periodStart: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      tasks: { select: { status: true, dueDate: true } },
    },
  });
}

export async function getWorkflowInstanceById(organizationId: string, id: string) {
  return db.workflowInstance.findFirst({
    where: { id, organizationId },
    include: {
      client: { select: { id: true, name: true } },
      workflowTemplate: { select: { id: true, name: true } },
      tasks: {
        orderBy: { order: "asc" },
        include: { assignee: { select: { id: true, displayName: true, email: true } } },
      },
    },
  });
}

export async function getWorkflowInstancesForClient(organizationId: string, clientId: string) {
  return db.workflowInstance.findMany({
    where: { organizationId, clientId },
    orderBy: { periodStart: "desc" },
    include: { tasks: { select: { status: true, dueDate: true } } },
  });
}

/** Every task across the portfolio with a due date, for the Calendar view. */
export async function getUpcomingTasks(organizationId: string) {
  return db.task.findMany({
    where: { workflowInstance: { organizationId }, status: { not: "DELIVERED" } },
    orderBy: { dueDate: "asc" },
    include: {
      workflowInstance: {
        select: { id: true, name: true, client: { select: { id: true, name: true } } },
      },
      assignee: { select: { displayName: true, email: true } },
    },
  });
}
