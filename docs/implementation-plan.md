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
- [x] Client 360 — Overview tab only; other tabs listed as upcoming on the
      page itself (Company profile, Engagement, Onboarding, Services, Work,
      Requests, Deliverables, Documents, Meetings, Financial operations,
      Billing, Health & risk, Activity timeline)
- [x] Command Centre — live counts (total/onboarding/active/watch+at-risk),
      clients by service bucket, recently updated clients
- [x] Team & role management (`/settings/team`) — the self-serve piece that
      makes sign-up usable without a separate invite system

Not yet built (placeholder pages exist at these routes today, labelled
"Ships Phase 1" in-product):
- [ ] Workflow-template engine (phase/job/task/checklist hierarchy,
      recurrence, dependencies) — `/work`, `/templates`
- [ ] Deadlines calendar — `/calendar`
- [ ] Internal document storage — `/documents`

New entities this phase needs (not yet in `schema.prisma`): `Engagement`,
`ServicePackage` (replacing the `ServiceBucket` enum), `WorkflowTemplate` +
version, `PhaseTemplate`, `TaskTemplate`, `ChecklistTemplate`,
`WorkflowInstance`, `Job`, `Task`, `Dependency`, `ChecklistResponse`,
`TaskEvidence`, `Document`, `DocumentVersion`.

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

If picking this back up, the highest-value next piece is the **workflow-
template engine** (Phase 1's remaining item) — it's the dependency for
Calendar, Documents-per-deliverable, and eventually Quality and Requests.
Building it before those means they're built against a real workflow
concept instead of a guessed one.
