# Implementation plan

Same phase structure as the original brief. Status reflects what's actually
in the repository, not intent. Also surfaced in-product at Settings → Build
roadmap (`os/src/app/(app)/settings/page.tsx`).

## Phase 0 — Foundation — **live**

- [x] Authentication (Supabase, email+password, session refresh middleware)
- [x] Organization/tenant model + RBAC (`Organization`, `Membership`,
      `OrgRole`, permission matrix)
- [x] Audit trail (`AuditEvent`, append-only)
- [x] Design system (Tailwind v4 theme tokens, `Button`/`Card`/`Badge`/
      `Input`/`Label` primitives)
- [x] Database migrations, verified against real Postgres (see
      `/docs/qa-plan.md`)
- [x] Row Level Security, verified for real (see `/docs/security.md`)
- [x] CI: typecheck, lint, test, build (`.github/workflows/os-ci.yml`)
- [x] Deployment topology: marketing site (GitHub Pages, unchanged) +
      OS (Vercel, root directory `os/`)

## Phase 1 — Operational MVP — **in progress**

Shipped:
- [x] Client portfolio list (`/clients`) with create-client form, RBAC-gated
- [x] Client 360 — Overview tab and a real Work tab (workflow instances for
      that client); remaining tabs listed as upcoming on the page itself
      (Company profile, Engagement, Onboarding, Services, Requests,
      Deliverables, Documents, Meetings, Financial operations, Billing,
      Health & risk, Activity timeline)
- [x] Command Centre — live counts (total/onboarding/active/watch+at-risk),
      clients by service bucket, recently updated clients
- [x] Team & role management (`/settings/team`) — the self-serve piece that
      makes sign-up usable without a separate invite system
- [x] **Workflow-template engine** (`/templates`, `/templates/[id]`) —
      `WorkflowTemplate` + `TaskTemplate`, RBAC-gated creation
      (`workflow:manageTemplates`). No versioning or dependency graph yet —
      see "Simplifications" below.
- [x] **Recurring/one-off work** (`/work`, `/work/[id]`) — instantiate a
      template for a client and period (`workflow:instantiate`); task
      status and assignee are editable inline (`task:updateStatus`,
      `task:assign`). Progress and "overdue" are computed, not stored — see
      `src/lib/workflow/status.ts`.
- [x] **Deadlines calendar** (`/calendar`) — every open task across the
      portfolio, bucketed into Overdue / 7 / 14 / 30 days / Later.
- [x] Seed data extended: 2 workflow templates, 3 workflow instances across
      3 clients with realistic status spread (one fully delivered, two
      running behind schedule with genuinely overdue tasks) — see
      `prisma/seed.ts`.

Not yet built (placeholder page exists at this route, labelled "Ships
Phase 1" in-product):
- [ ] Internal document storage — `/documents`

### Simplifications taken to ship this slice (not silent — tracked here)

- **No dependency graph between tasks.** The brief asks for blocking rules
  and parallel branches; this slice has a flat, ordered task list per
  workflow instance. Real enough to run recurring monthly/quarterly work
  end to end; add dependencies when a real template needs "don't start B
  until A is done" enforced rather than just implied by task order.
- **No template versioning.** Editing a `WorkflowTemplate`'s tasks changes
  what future instantiations create; past `WorkflowInstance`/`Task` rows
  already copied their values at creation time (see `/docs/data-model.md`),
  so history is safe — but there's no `WorkflowTemplateVersion` record of
  *which* edit produced *which* instance. Add if template change history
  itself becomes something CFOIP needs to audit.
- **Default assignee role on `TaskTemplate` is unused.** The schema field
  exists (`defaultAssigneeRole`); instantiation currently leaves every task
  unassigned for a human to pick up from `/work/[id]`. Wiring
  role-based auto-assignment needs a rule for *which* person holding that
  role gets it (round-robin? least-loaded? — a capacity-planning question
  that's Phase 2 scope), so it's left manual for now rather than guessed.
- **Calendar math is UTC-calendar, not organization-timezone-aware.** See
  the comment in `src/lib/workflow/period.ts`. Fine for Africa/Nairobi
  (UTC+3, no DST); revisit before onboarding a client whose reporting
  calendar depends on a timezone far enough from UTC for a day boundary to
  shift.

New entities this phase still needs beyond what's built (not yet in
`schema.prisma`): `Engagement`, `ServicePackage` (replacing the
`ServiceBucket` enum — see `/docs/decision-log.md`), `ChecklistTemplate` +
`ChecklistResponse` (per-task checklists, distinct from the task itself),
`TaskEvidence`, `Document`, `DocumentVersion`, `WorkflowTemplateVersion`,
`TaskDependency`.

## Phase 2 — Service control — **planned**

- [ ] Client portal (new client-facing role model — see
      `/docs/data-model.md` "memberships" for why this isn't just reusing
      `OrgRole`)
- [ ] Ad hoc requests (`/requests`) — SLA clocks, triage, scope approval
- [ ] Quality review/approval (`/quality`) — `canReview()` already exists
      (`src/lib/auth/rbac.ts`); needs `Deliverable`, `DeliverableVersion`,
      `Review`, `ReviewFinding`, `SignOff`
- [ ] Meetings & decisions
- [ ] Capacity planning (`/team`)
- [ ] Richer reporting (`/reports`)

## Phase 3 — Commercial management — **planned**

- [ ] Time entry & timesheets
- [ ] Budgets, retainers, rate cards
- [ ] Invoicing, credits, collections
- [ ] Realisation & profitability reporting

`billing:view` permission already exists in the RBAC matrix
(`src/lib/auth/rbac.ts`) ahead of this phase, so the "who's allowed to see
money" decision is made once, not revisited when Billing ships.

## Phase 4 — Integrations & intelligence — **planned**

- [ ] Accounting adapters (QuickBooks Online, Xero, Zoho Books, Sage)
- [ ] Email/calendar (Microsoft 365, Google Workspace)
- [ ] Document storage (OneDrive/SharePoint, Google Drive, Dropbox)
- [ ] E-signature adapter
- [ ] Payment provider (card + mobile money, M-Pesa-ready)
- [ ] Client health scoring (the weighted model from the brief) — needs
      Work, Quality and Billing data to score against
- [ ] Advanced automation rules engine

Per the brief: **do not start Phase 4 while tenant isolation, auditability,
QA gates and recovery procedures are incomplete.** Phase 2's Quality module
and a real incident-response/backup runbook are the gating items.

## Immediate next slice (recommendation)

Phase 1's only remaining item is **internal document storage**
(`/documents`) — Supabase Storage-backed, with `Document`/`DocumentVersion`
metadata in Postgres, short-lived signed URLs (never public bucket URLs),
and virus-scanning hooked in per `/docs/security.md`. After that, Phase 1 is
complete and Phase 2 (client portal, Quality, Requests) can start against a
real workflow/task concept instead of a guessed one.
