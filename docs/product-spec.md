# CFOIP OS — Product Spec

## What this is

CFOIP OS is CFO Innovation Partners' internal practice operating system: one
place to run client delivery from prospect handover through onboarding,
recurring delivery, quality review, billing, relationship health and
renewal/offboarding. It is not a generic project-management tool and it is
not a general ledger — it is a service-delivery system of record that
integrates with accounting/document/e-sign/payment tools rather than
replacing them.

The full target scope is the practice-management platform described in the
original product brief (client portfolio + Client 360, workflow engine,
quality assurance, time/billing, client portal, reporting, health scoring,
automations, integrations). That brief is large enough to be a multi-quarter
build; this document, together with `/docs/implementation-plan.md`, is the
sequenced, honest account of what exists today versus what's designed and
queued.

## Product principles

These carry through every phase, not just what's built so far:

1. **Portfolio first, client deep** — leadership sees the whole portfolio;
   each client has a complete workspace (Client 360).
2. **Workflow before task** — tasks belong to service workflows, milestones
   and quality gates, not standalone to-do items.
3. **One accountable owner** — every client, service, request, task,
   deliverable and exception has a named owner.
4. **No silent delays** — blocked, overdue and awaiting-client states must be
   visible, not buried.
5. **Quality is designed in** — preparer/reviewer/approver segregation is
   enforced in code (`canReview()` in `os/src/lib/auth/rbac.ts`), not left to
   convention.
6. **Client effort is explicit** — client requests have owners, due dates and
   status (Phase 2).
7. **Commercial discipline** — scope, time, fees and profitability connect to
   delivery (Phase 3).
8. **Evidence over status claims** — completion requires the relevant file,
   approval or checklist, not just a status flip.
9. **Simple interfaces** — show the next decision and the next action.
10. **Configurable, not hard-coded** — service templates, roles and rules are
    editable by authorised administrators as each module ships.
11. **Secure by default** — least privilege, tenant isolation and
    auditability from Phase 0, described in `/docs/security.md`.

## Who uses it

Internal roles (CFOIP staff) and client roles (client-side users, Phase 2).
The authority matrix for internal roles is implemented today in
`os/src/lib/auth/rbac.ts` and documented in full in `/docs/security.md`.

## Differentiation

CFOIP OS is built around fractional-CFO and advisory delivery specifically:
monthly management reporting, cash-flow advisory, budgeting, board packs,
investor readiness, controls work and finance-function improvement — not
generic tax/audit practice management. The seed data
(`os/prisma/seed.ts`) reflects this: five service portfolio buckets (Monthly
CFO, Bookkeeping Oversight, Cash-flow Advisory, Investor Readiness, Ad Hoc
Projects) across clients in Kenya, Tanzania, Nigeria and Rwanda.

## Visual system

Navy/gold identity, defined as Tailwind v4 theme tokens in
`os/src/app/globals.css`:

| Token | Value | Use |
|---|---|---|
| `--color-navy-900` | `#071A33` | Primary text/background |
| `--color-navy-700` | `#12345A` | Secondary navy |
| `--color-gold-500` | `#C99A2E` | Accent, active states |
| `--color-gold-300` | `#E4C56A` | Accent hover |
| `--color-warm-white` | `#F8F7F3` | App background |
| `--color-slate-text` | `#334155` | Body text |
| success/warning/danger/info | see `globals.css` | Status — always paired with a label, never colour alone |

The public marketing site (`/index.html`) keeps its own established
green/neutral palette (`styles.css`) — the navy/gold system applies to the
OS application only, reached via the "Access your OS" link in the
marketing nav.

## What's live today vs. designed for later

See `/docs/implementation-plan.md` for the phase-by-phase breakdown, and
`os/src/app/(app)/settings/page.tsx` (Settings → Build roadmap) for the
same information surfaced in-product.
