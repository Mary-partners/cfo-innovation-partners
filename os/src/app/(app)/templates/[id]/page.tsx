import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { getWorkflowTemplateById } from "@/lib/queries/workflow";
import { can } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICE_BUCKET_LABEL } from "@/components/os/status-badge";
import { RECURRENCE_LABEL } from "@/lib/workflow/period";
import { AddTaskTemplateForm } from "@/components/os/add-task-template-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const actor = await requireActor();
  const template = await getWorkflowTemplateById(actor.organizationId, id);
  return { title: template?.name ?? "Template" };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireActor();
  const template = await getWorkflowTemplateById(actor.organizationId, id);
  if (!template) notFound();

  const canManage = can(actor.membership.role, "workflow:manageTemplates");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">{template.name}</h1>
        <p className="text-sm text-slate-text/70">
          {SERVICE_BUCKET_LABEL[template.serviceBucket] ?? template.serviceBucket} ·{" "}
          {RECURRENCE_LABEL[template.recurrence]}
        </p>
        {template.description ? (
          <p className="mt-2 max-w-2xl text-sm text-slate-text">{template.description}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tasks ({template.taskTemplates.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {template.taskTemplates.length === 0 ? (
              <p className="p-5 text-sm text-slate-text/60">
                No tasks yet. Add the first one from the panel on the right — instantiating this
                template for a client will create one task per template task, due that many days
                into the period.
              </p>
            ) : (
              <ol className="divide-y divide-navy-900/5">
                {template.taskTemplates.map((tt, index) => (
                  <li key={tt.id} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-navy-900">
                      <span className="mr-2 text-slate-text/40">{index + 1}.</span>
                      {tt.title}
                    </span>
                    <span className="text-xs text-slate-text/50">
                      Due day {tt.relativeDueDays}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a task</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {canManage ? (
              <AddTaskTemplateForm
                workflowTemplateId={template.id}
                nextOrder={template.taskTemplates.length}
              />
            ) : (
              <p className="text-sm text-slate-text/60">
                Your role doesn&apos;t have permission to edit templates.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
