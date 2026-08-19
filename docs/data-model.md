# Data model

Source of truth: `os/prisma/schema.prisma`. This document explains the
*why* behind it and lists what's deliberately not modelled yet.

## Entity relationship diagram (Phase 0/1 slice)

```
Organization 1───* Membership *───1 (Supabase auth.users, by userId — no local table)
     │                  │  ▲              ▲
     │                  │  └── portfolioLeadId ──┐
     │                  │  └── relationshipOwnerId┤
     │                  │                          │
     1                  *                          │
     └───────────────* Client ──────────────────────┘
                          │
                          1
                          └───* ClientContact

Organization 1───* AuditEvent *───0..1 Membership (actor)
```

## Why these five tables and not the full section-20 list

The original brief lists ~30 entities across workflow, quality, billing,
documents, requests, meetings, health scoring and integrations. Building all
of them before any UI exists on top of them would mean a schema with no
proof it's the *right* shape. Phase 0/1 instead models exactly what the
shipped UI (Command Centre, Clients list, Client 360 overview, Team) needs,
and grows the schema alongside each subsequent phase's UI. The full target
entity list — grouped by the phase that introduces it — is in
`/docs/implementation-plan.md`.

## Tables

### `organizations`
One row per practice tenant. CFOIP runs a single row today
(`slug = "cfoip"`), created lazily on first sign-in
(`getOrCreateDefaultOrganization()` in `src/lib/auth/session.ts`).

### `memberships`
Links a Supabase `auth.users.id` (`userId`, uuid) to an `Organization` with
an `OrgRole`. There is deliberately no local `users` table — email and
display name are copied onto `Membership` at creation time (from the
Supabase user) rather than joined live, so the app never needs a second
round-trip to Supabase Auth just to render a name. `(organizationId,
userId)` is unique.

`OrgRole` enum: `MANAGING_PARTNER`, `PRACTICE_ADMIN`, `PORTFOLIO_LEAD`,
`RELATIONSHIP_MANAGER`, `SERVICE_LEAD`, `PREPARER_ANALYST`,
`INDEPENDENT_REVIEWER`, `FINANCE_BILLING`, `READ_ONLY_AUDITOR`. Client-facing
roles (`CLIENT_ADMIN`, `CLIENT_COLLABORATOR` in the original brief) are not
modelled yet — they arrive with the client portal in Phase 2, likely as a
separate `ClientMembership` table scoped to one `Client` rather than the
whole `Organization`, since a client user must never see another client's
data even within the same practice.

### `clients`
One row per client company. `lifecycleStage` (`PROSPECT` → `ONBOARDING` →
`ACTIVE` → `WATCH`/`AT_RISK`/`RENEWING`/`PAUSED` → `OFFBOARDING` →
`OFFBOARDED`) and `serviceBucket` (`MONTHLY_CFO`, `BOOKKEEPING_OVERSIGHT`,
`CASH_FLOW_ADVISORY`, `INVESTOR_READINESS`, `AD_HOC_PROJECTS`) are enums for
now. `serviceBucket` becomes a configurable `ServicePackage` entity once
Templates & Automations (Phase 1 tail / Phase 2) needs administrators to
define new service lines without a schema change — tracked in
`/docs/decision-log.md`.

`healthScore`/`healthStatus` are nullable columns, written to manually for
now (seed data only). The weighted scoring model from the brief (delivery
timeliness 20%, responsiveness 15%, quality 15%, relationship 15%, payment
15%, scope stability 10%, strategic outcomes 10%) is Phase 4 work — it needs
Work, Quality and Billing data feeding it first.

### `client_contacts`
Simple contact list per client (name, email, role, primary flag). Expands
into the full company-profile model (registration info, directors/UBOs,
banking/accounting systems) in Phase 1's Client 360 "Company profile" tab.

### `audit_events`
Append-only. `AuditAction` is a closed enum extended as each module adds
actions worth auditing (today: sign-up, membership role changes, client
create). Never updated or deleted from application code — see
`/docs/security.md`.

## Conventions

- **IDs**: UUID primary keys (`@default(uuid())`), matching Supabase's own
  `auth.users.id` type so foreign-key-shaped joins (`Membership.userId`) are
  possible without a type cast.
- **Timestamps**: `createdAt`/`updatedAt` on every table that's mutated
  after creation; stored as Postgres `timestamp(3)` (UTC implicitly — the
  app never writes a timezone-aware value), displayed in the org's
  `timezone` field (`Africa/Nairobi` default).
- **Table names**: snake_case via `@@map` (`organizations`, `client_contacts`,
  ...); Prisma field names stay camelCase, so generated SQL always quotes
  identifiers like `"organizationId"` — this is normal Prisma output, not a
  hand-editing mistake, and matters if you ever write raw SQL against these
  tables (see the RLS migration for the exact quoting).
- **Money**: not yet modelled (no billing tables in Phase 0/1). When Phase 3
  adds them, money is stored as integer minor units + an ISO currency code
  per the original brief, never as floating point.
- **Soft delete**: not used anywhere yet. Nothing in Phase 0/1 has a business
  reason to be soft-deleted rather than genuinely removed (a mis-added
  client can just be deleted); this is revisited per-table as retention
  requirements land (documents, financial records).

## Migrations

`os/prisma/migrations/` — two so far:

1. `20260819092543_init` — the tables above.
2. `20260819092604_enable_row_level_security` — RLS policies (see
   `/docs/security.md`). Deliberately a separate migration from `init` so the
   schema and its security policies have independent, reviewable history.

Both were generated and applied against a real local Postgres 16 instance
during development (not just written by hand and hoped correct) — see
`/docs/setup.md` "Verifying migrations locally" if you need to do the same.
