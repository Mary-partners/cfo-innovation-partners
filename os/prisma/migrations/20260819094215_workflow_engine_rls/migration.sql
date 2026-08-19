-- Row Level Security for the workflow engine tables. Same posture as
-- 20260819092604_enable_row_level_security: defense-in-depth for any
-- access path that isn't the trusted Prisma server connection. See
-- /docs/security.md.

ALTER TABLE "workflow_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_templates_select_same_org" ON "workflow_templates"
  FOR SELECT
  USING ("organizationId" IN (SELECT public.current_org_ids()));

CREATE POLICY "task_templates_select_same_org" ON "task_templates"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "workflow_templates" wt
      WHERE wt."id" = "task_templates"."workflowTemplateId"
        AND wt."organizationId" IN (SELECT public.current_org_ids())
    )
  );

CREATE POLICY "workflow_instances_select_same_org" ON "workflow_instances"
  FOR SELECT
  USING ("organizationId" IN (SELECT public.current_org_ids()));

CREATE POLICY "tasks_select_same_org" ON "tasks"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "workflow_instances" wi
      WHERE wi."id" = "tasks"."workflowInstanceId"
        AND wi."organizationId" IN (SELECT public.current_org_ids())
    )
  );

-- No write policies, same reasoning as the first RLS migration: all writes
-- go through the application server, which enforces RBAC before writing.
