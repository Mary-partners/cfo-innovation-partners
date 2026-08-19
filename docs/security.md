# Security

This document tracks toward ISO/IEC 27001 and SOC 2 Trust Services Criteria
patterns (least privilege, auditability, tenant isolation, encryption in
transit/at rest) as a design discipline. **It is not a claim of certification
or legal compliance.** CFOIP should get a specialist security/legal review
(including Kenya Data Protection Act, 2019 obligations, and GDPR if serving
EU-connected clients) before handling real client financial data in
production — flagged again in `/docs/decision-log.md`.

## Roles and authority

Implemented in `os/src/lib/auth/rbac.ts`, one file, one matrix
(`ROLE_PERMISSIONS`), tested in `os/src/tests/unit/rbac.test.ts`.

| Role | Core authority (Phase 0/1 permissions) |
|---|---|
| Managing Partner | Everything |
| Practice Administrator | Clients, team roles, settings, audit log — not billing |
| Portfolio Lead / CFO | Clients (view/create/edit), billing visibility |
| Client Relationship Manager | Clients (view/edit) |
| Service Lead | Clients (view/edit) |
| Preparer / Analyst | Clients (view only) |
| Independent Reviewer | Clients (view only) |
| Finance / Billing | Clients (view), billing visibility |
| Read-only / Auditor | Clients (view), audit log |

The permission surface is intentionally small right now (`client:*`,
`membership:*`, `audit:view`, `settings:manage`, `billing:view`) because
that's all that's built. It grows with each phase — every new module adds
its own permissions to the same matrix rather than inventing a parallel
authorization mechanism. `billing:view` already exists in the matrix ahead
of the Billing module (Phase 3) shipping, so the authority decision (who
gets to see money) is made once and doesn't need revisiting when Billing
lands.

**Segregation of duties**: `canReview(preparerMembershipId,
reviewerMembershipId)` in the same file refuses self-review. It's not wired
into a UI yet (Quality is Phase 2) but the rule lives in one place from day
one rather than being bolted onto the Quality module later.

## Tenant isolation

Two independent layers, deliberately not just one:

1. **Application-layer scoping** (primary, enforced today): every read in
   `src/lib/queries/*.ts` takes `organizationId` as an explicit, required
   parameter and filters by it. `getClientById(organizationId, clientId)`
   returns `null` — not another org's row — if the client belongs to a
   different organization; `os/src/app/(app)/clients/[id]/page.tsx` calls
   `notFound()` on `null`. The app's own Postgres connection (via Prisma)
   authenticates as a privileged Supabase role that has no RLS restriction
   of its own, so **this is the layer actually protecting the app today** —
   it's covered by code review and by the shape of every query function
   (there is no query function that omits the `organizationId` parameter).

2. **Row Level Security** (defense-in-depth, for other access paths):
   `os/prisma/migrations/20260819092604_enable_row_level_security/migration.sql`
   enables RLS and adds `SELECT` policies on every tenant table, keyed off
   `auth.uid()`. This protects any *other* route into the same database —
   a browser Supabase client, Supabase's PostgREST auto-API, a future
   integration — none of which this app currently uses for data queries,
   but which would otherwise have no tenant boundary at all if ever added
   carelessly. **This does not currently gate the Next.js app's own Prisma
   queries**, because that connection uses a role that bypasses RLS (see
   `/docs/architecture.md` "Database connection strategy"). Making the
   Prisma connection RLS-aware too (by propagating the signed-in user's JWT
   into a `SET LOCAL` at the start of each transaction) is a real
   architecture change, tracked as a reversible assumption in
   `/docs/decision-log.md`, not done yet.

   The RLS policies were verified against a real local Postgres instance,
   not just written and assumed correct: with two organizations, two
   memberships and two clients seeded, a session claiming user A's identity
   (`SET request.jwt.claim.sub = '<user A uuid>'`) sees exactly one client
   (Org A's); a session claiming user B's identity sees only Org B's; a
   session with no claim sees zero rows; and direct `INSERT`/`UPDATE`/
   `DELETE` attempts from the `authenticated` role are rejected with
   `permission denied` (no write policies are defined — RLS denies by
   default). See `/docs/setup.md` to reproduce.

   One non-obvious bug this caught: a naive policy on `memberships` that
   queries `memberships` again inside itself causes Postgres to report
   *"infinite recursion detected in policy"* — RLS re-evaluates on every
   table the policy touches, including the table the policy is on. Fixed
   with a `SECURITY DEFINER` helper function (`public.current_org_ids()`)
   that runs as the migration-owner role, which is exempt from RLS on
   tables it owns, so the internal lookup doesn't re-trigger the policy.

## Audit trail

`AuditEvent` (`os/prisma/schema.prisma`) is append-only by convention — no
application code updates or deletes rows from it. Written today for:
`USER_SIGNED_UP`, `MEMBERSHIP_ROLE_CHANGED`, `CLIENT_CREATED`. Extended per
phase (the enum, `AuditAction`, has room for `MEMBERSHIP_DEACTIVATED`,
`CLIENT_UPDATED`, `CLIENT_LIFECYCLE_CHANGED` already reserved for
near-term use). Not yet exposed in a UI (Read-only/Auditor role has
`audit:view` permission granted, waiting on a screen) — Phase 1/2 backlog
item, see `/docs/implementation-plan.md`.

## Authentication

Supabase Auth, email + password, via `@supabase/ssr`
(`os/src/lib/supabase/{client,server}.ts`, `os/src/middleware.ts`). Session
cookies are httpOnly and refreshed on every request by middleware using
`getUser()` (which revalidates against Supabase, not `getSession()`, which
only reads the possibly-stale cookie — the deliberate choice, see the
comment in `middleware.ts`). Password policy enforced client- and
server-side via the shared Zod schema (`src/lib/validation/auth.ts`):
minimum 10 characters, upper, lower, and a digit.

**Not yet built**: MFA, passwordless/magic-link login, session revocation UI.
The brief asks for "MFA-capable" — Supabase Auth supports TOTP MFA natively;
enabling it is a Phase 1/2-scoped follow-up (needs a settings UI for
enrollment), not a platform limitation.

## Secrets

`.env.example` documents every required variable with no real values.
`SUPABASE_SERVICE_ROLE_KEY` is present in the example file for future admin
tooling but nothing in the Phase 0/1 codebase actually imports or uses it
yet — grep `os/src` before wiring anything to it, and keep it server-only
(never `NEXT_PUBLIC_`) when you do. Real secrets live only in Vercel's
Environment Variables and the developer's local `.env.local` (gitignored).

## Dependency posture

`npm audit` currently reports 3 high-severity advisories, all transitive
through `prisma`'s own config loader (`@prisma/config` → `deepmerge-ts`,
a stack-exhaustion-on-deeply-recursive-input issue). This is a build/CLI-time
dependency, not something bundled into the deployed app, and the inputs it
merges are our own config files, not attacker-controlled data — low real
risk, but worth re-checking (`npm audit` in `os/`) next time dependencies are
bumped.

## What's explicitly out of scope for this phase

Rate limiting, CSRF tokens (Next.js Server Actions have built-in origin
checking, which covers the current attack surface but hasn't been
independently verified), virus/malware scanning (no file upload exists
yet), field-level encryption, backup/restore runbooks, and incident-response
process. All tracked in `/docs/implementation-plan.md` against the phase
that introduces the feature they'd protect (documents, billing, etc.) —
listing them here now so nobody mistakes their absence for an oversight.
