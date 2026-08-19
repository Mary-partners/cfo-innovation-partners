# Decision log

Assumptions made to keep moving without a blocking question, in the order
they came up. All marked reversible unless stated otherwise — flag any of
these to revisit and it can change without a schema rewrite.

## Single-tenant bootstrap

**Decision**: model the schema as multi-tenant (`Organization` →
everything) but only ever create one `Organization` row
(`slug = "cfoip"`), auto-created on first sign-in.

**Why**: CFOIP runs one practice. Hard-coding "there is exactly one
organization" throughout the app would be simpler today but means real
rework if CFOIP ever wants to run a second brand or spin off a sister
practice on the same platform. Modelling multi-tenant now costs almost
nothing (one `organizationId` column and filter per query) and keeps the
door open.

**Reversible?** The schema shape stays either way. What would change: the
sign-up flow currently has no "which organization" step (there's only one
to join) — adding a second org means adding that step.

## First-user-becomes-Managing-Partner

**Decision**: the first person to sign in to a fresh organization is
automatically `MANAGING_PARTNER`; everyone after defaults to
`PREPARER_ANALYST` pending a manual promotion from Settings → Team.

**Why**: the brief wants self-serve "log in or create an account" with no
separate invite-and-provision system built yet (that's more Phase 2/3
scope — proper invite links, SSO, etc.). This bootstrap rule is the standard
pattern for exactly this situation and avoids a chicken-and-egg problem
(you need an admin to create the first admin).

**Risk accepted**: anyone who discovers the sign-up URL before CFOIP's first
real user does becomes Managing Partner. Low risk in practice — the URL
isn't advertised until the marketing site's "Access your OS" link points to
a domain CFOIP controls — but worth CFOIP actually being the first sign-up
once the real Supabase project exists, not leaving it open for testing.

**Reversible?** Yes — replace with an explicit invite-code or
domain-allowlist check in `src/lib/auth/session.ts` `getOrCreateCurrentActor`
whenever this stops being acceptable.

## Marketing site left as static HTML, OS as a separate Next.js app

See `/docs/architecture.md` "Why a subdirectory instead of one Next.js app"
for the reasoning. Reversible, but the cost of reversing grows every time
someone hand-edits `index.html` (more drift to reconcile if it's ever ported
into JSX later).

## "Access your OS" link points to a placeholder domain

`index.html`'s nav link is `https://os.cfoinnovationpartners.com` — a
guess at what CFOIP will eventually use, not a domain that resolves today.
**Must be updated** once the Vercel deployment has a real URL (either the
`*.vercel.app` default or a connected custom domain) — see
`/docs/setup.md` step 6. Until then, clicking it in production goes nowhere.

## Prisma 7 driver adapters instead of the classic client

Prisma 7 removed `datasource.url` from the client-facing config
(`schema.prisma` no longer carries a live connection string — only the CLI's
`prisma.config.ts` does, for migrations). The running app builds its
`PrismaClient` with `@prisma/adapter-pg` instead. This wasn't a choice among
alternatives — it's a hard requirement of the Prisma version available at
build time (7.9.1, current on npm as of this session) — but it does mean the
migration-connection (`DIRECT_URL`) and runtime-connection (`DATABASE_URL`)
are configured in two different places (`prisma.config.ts` vs. `src/lib/db.ts`)
rather than one. Documented explicitly in both files so it isn't mistaken
for a bug later.

## `ServiceBucket` as an enum, not a table

**Decision**: Phase 1 models a client's service portfolio as a fixed enum
(`MONTHLY_CFO`, `BOOKKEEPING_OVERSIGHT`, `CASH_FLOW_ADVISORY`,
`INVESTOR_READINESS`, `AD_HOC_PROJECTS`) rather than a configurable
`ServicePackage` table.

**Why**: matches the five buckets the brief's own seed-data spec calls for,
and nothing in Phase 0/1 needs an administrator to define a *new* bucket
through the UI yet — that need arrives with Templates & Automations.
Building the configurable version now, before Templates exists to configure
it, would be speculative.

**Reversible?** Yes, but not free — becomes a real migration (enum column →
foreign key) when Phase 1's workflow-template engine needs services to be
configurable. Flagged in `/docs/implementation-plan.md` under Phase 1's
"new entities needed."

## Row Level Security does not yet cover the app's own database connection

Covered in full in `/docs/security.md` "Tenant isolation" — restating the
headline here because it's the single most important thing to know before
treating this as more secure than it is: **the Prisma connection bypasses
RLS.** Tenant isolation for the app itself is enforced in application code
today, not by the database. RLS protects other access paths. Closing that
gap (routing the app's own queries through an RLS-aware connection) is real
work, not a checkbox — tracked here rather than silently assumed done.

## No Playwright / E2E tests yet

Deliberately not added half-configured against a fake auth session — see
`/docs/qa-plan.md` "What's not verified, and why."

## Specialist review still needed before real client data

Restating from `/docs/security.md`: this system is *designed toward*
ISO 27001 / SOC 2 patterns and Kenya DPA / GDPR-capable controls, but has
had no external security or legal review. Get one before onboarding a real
client's financial data, not before "launch" in some vaguer sense — the
distinction matters because Phase 1 (Client 360, no real financial documents
yet) is lower-stakes than Phase 2 (client portal, real document exchange).
