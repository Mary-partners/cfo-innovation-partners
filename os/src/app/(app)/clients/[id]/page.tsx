import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { getClientById } from "@/lib/queries/clients";
import { getWorkflowInstancesForClient } from "@/lib/queries/workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LifecycleBadge, HealthBadge, SERVICE_BUCKET_LABEL } from "@/components/os/status-badge";
import { WorkflowInstanceStatusBadge } from "@/components/os/workflow-status-badge";
import { ProgressBar } from "@/components/os/progress-bar";
import { computeWorkflowProgress } from "@/lib/workflow/status";

const UPCOMING_TABS = [
  "Company profile",
  "Engagement",
  "Onboarding",
  "Services",
  "Requests",
  "Deliverables",
  "Documents",
  "Meetings",
  "Financial operations",
  "Billing",
  "Health & risk",
  "Activity timeline",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const actor = await requireActor();
  const client = await getClientById(actor.organizationId, id);
  return { title: client?.name ?? "Client" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireActor();
  // Scoped to actor.organizationId — a client belonging to another tenant
  // resolves to null here, never a cross-tenant record. Verified against a
  // real Postgres instance for real, not just by inspection — see the RLS
  // section of /docs/security.md.
  const client = await getClientById(actor.organizationId, id);

  if (!client) {
    notFound();
  }

  const workflowInstances = await getWorkflowInstancesForClient(actor.organizationId, client.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">{client.name}</h1>
          <p className="text-sm text-slate-text/70">
            {client.country} · {client.currency} ·{" "}
            {SERVICE_BUCKET_LABEL[client.serviceBucket] ?? client.serviceBucket}
          </p>
        </div>
        <div className="flex gap-2">
          <LifecycleBadge stage={client.lifecycleStage} />
          <HealthBadge status={client.healthStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 pt-2 text-sm">
            <div>
              <dt className="text-slate-text/50">Relationship owner</dt>
              <dd className="font-medium text-navy-900">
                {client.relationshipOwner?.displayName ?? client.relationshipOwner?.email ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-text/50">Portfolio lead</dt>
              <dd className="font-medium text-navy-900">
                {client.portfolioLead?.displayName ?? client.portfolioLead?.email ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-text/50">Reporting year-end</dt>
              <dd className="font-medium text-navy-900">{client.reportingYearEnd ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-text/50">Contacts on file</dt>
              <dd className="font-medium text-navy-900">{client.contacts.length}</dd>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming to this workspace</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ul className="flex flex-wrap gap-1.5">
              {UPCOMING_TABS.map((tab) => (
                <li
                  key={tab}
                  className="rounded-full bg-navy-900/5 px-2.5 py-1 text-xs text-slate-text"
                >
                  {tab}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-text/50">
              See /docs/implementation-plan.md for when each tab ships.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work ({workflowInstances.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {workflowInstances.length === 0 ? (
            <p className="p-5 text-sm text-slate-text/60">
              No work started for this client yet.{" "}
              <Link href="/work" className="underline">
                Start a workflow
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-navy-900/5">
              {workflowInstances.map((instance) => {
                const progress = computeWorkflowProgress(instance.tasks);
                return (
                  <li key={instance.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link
                        href={`/work/${instance.id}`}
                        className="text-sm font-medium text-navy-900 hover:underline"
                      >
                        {instance.name}
                      </Link>
                      <div className="text-xs text-slate-text/50">
                        {new Date(instance.periodStart).toLocaleDateString()} –{" "}
                        {new Date(instance.periodEnd).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <ProgressBar percent={progress} />
                      </div>
                      <span className="w-9 text-right text-xs text-slate-text/60">{progress}%</span>
                      <WorkflowInstanceStatusBadge status={instance.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
