import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/auth/session";
import { getWorkflowInstances, getActiveWorkflowTemplates } from "@/lib/queries/workflow";
import { getClientList } from "@/lib/queries/clients";
import { can } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowInstanceStatusBadge } from "@/components/os/workflow-status-badge";
import { ProgressBar } from "@/components/os/progress-bar";
import { computeWorkflowProgress, computeIsOverdue } from "@/lib/workflow/status";
import { InstantiateWorkflowForm } from "@/components/os/instantiate-workflow-form";

export const metadata: Metadata = { title: "Work" };

export default async function WorkPage() {
  const actor = await requireActor();
  const [instances, templates, clients] = await Promise.all([
    getWorkflowInstances(actor.organizationId),
    getActiveWorkflowTemplates(actor.organizationId),
    getClientList(actor.organizationId),
  ]);
  const canInstantiate = can(actor.membership.role, "workflow:instantiate");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Work</h1>
        <p className="text-sm text-slate-text/70">{instances.length} workflow instances across the portfolio.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {instances.length === 0 ? (
              <p className="p-5 text-sm text-slate-text/60">
                No work started yet. Start the first one from the panel on the right.
              </p>
            ) : (
              <ul className="divide-y divide-navy-900/5">
                {instances.map((instance) => {
                  const progress = computeWorkflowProgress(instance.tasks);
                  const overdueCount = instance.tasks.filter(computeIsOverdue).length;
                  return (
                    <li key={instance.id} className="flex flex-col gap-2 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            href={`/work/${instance.id}`}
                            className="font-medium text-navy-900 hover:underline"
                          >
                            {instance.name}
                          </Link>
                          <div className="text-xs text-slate-text/50">
                            {instance.client.name} · period{" "}
                            {new Date(instance.periodStart).toLocaleDateString()} –{" "}
                            {new Date(instance.periodEnd).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {overdueCount > 0 ? (
                            <span className="text-xs font-medium text-danger">
                              {overdueCount} overdue
                            </span>
                          ) : null}
                          <WorkflowInstanceStatusBadge status={instance.status} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar percent={progress} />
                        <span className="w-10 shrink-0 text-right text-xs text-slate-text/60">
                          {progress}%
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start work</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {canInstantiate ? (
              <InstantiateWorkflowForm clients={clients} templates={templates} />
            ) : (
              <p className="text-sm text-slate-text/60">
                Your role doesn&apos;t have permission to start new work.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
