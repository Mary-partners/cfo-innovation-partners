import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { getWorkflowInstanceById } from "@/lib/queries/workflow";
import { db } from "@/lib/db";
import { can } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowInstanceStatusBadge, TaskStatusBadge } from "@/components/os/workflow-status-badge";
import { ProgressBar } from "@/components/os/progress-bar";
import { computeWorkflowProgress } from "@/lib/workflow/status";
import { TaskStatusForm } from "@/components/os/task-status-form";
import { TaskAssigneeForm } from "@/components/os/task-assignee-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const actor = await requireActor();
  const instance = await getWorkflowInstanceById(actor.organizationId, id);
  return { title: instance?.name ?? "Work" };
}

export default async function WorkflowInstanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireActor();
  const [instance, members] = await Promise.all([
    getWorkflowInstanceById(actor.organizationId, id),
    db.membership.findMany({
      where: { organizationId: actor.organizationId, isActive: true },
      select: { id: true, displayName: true, email: true },
    }),
  ]);
  if (!instance) notFound();

  const canUpdateStatus = can(actor.membership.role, "task:updateStatus");
  const canAssign = can(actor.membership.role, "task:assign");
  const progress = computeWorkflowProgress(instance.tasks);
  const memberOptions = members.map((m) => ({ id: m.id, label: m.displayName ?? m.email }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">{instance.name}</h1>
          <p className="text-sm text-slate-text/70">
            <Link href={`/clients/${instance.client.id}`} className="underline">
              {instance.client.name}
            </Link>{" "}
            · period {new Date(instance.periodStart).toLocaleDateString()} –{" "}
            {new Date(instance.periodEnd).toLocaleDateString()}
          </p>
        </div>
        <WorkflowInstanceStatusBadge status={instance.status} />
      </div>

      <div className="flex items-center gap-3">
        <ProgressBar percent={progress} />
        <span className="w-10 shrink-0 text-right text-sm text-slate-text/60">{progress}%</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({instance.tasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {instance.tasks.length === 0 ? (
            <p className="p-5 text-sm text-slate-text/60">
              This workflow instance has no tasks (it may have been started from a template with
              none defined yet).
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy-900/10 text-xs uppercase tracking-wide text-slate-text/50">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Task
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Due
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Assignee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/5">
                {instance.tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-5 py-3 text-navy-900">{task.title}</td>
                    <td className="px-5 py-3 text-slate-text">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <TaskStatusBadge task={task} />
                        {canUpdateStatus ? (
                          <TaskStatusForm taskId={task.id} currentStatus={task.status} />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {canAssign ? (
                        <TaskAssigneeForm
                          taskId={task.id}
                          currentAssigneeId={task.assignee?.id ?? null}
                          members={memberOptions}
                        />
                      ) : (
                        <span className="text-slate-text">
                          {task.assignee?.displayName ?? task.assignee?.email ?? "Unassigned"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
