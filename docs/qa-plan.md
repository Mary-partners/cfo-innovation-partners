# QA plan

Two different things share the name "quality" in this project — don't
conflate them:

1. **Engineering QA** — how we know the *software* works (this document).
2. **The Quality module** — the preparer/reviewer/approver *product feature*
   for reviewing client deliverables, described in the original brief
   section 10. Not built yet (Phase 2). `canReview()` (segregation of
   duties) is implemented ahead of time in `os/src/lib/auth/rbac.ts` so the
   rule exists before the UI does — see `/docs/security.md`.

This document is about (1).

## What's actually verified, and how

| Check | Command | Status |
|---|---|---|
| Type safety | `npm run typecheck` (`os/`) | Passing, zero errors |
| Lint | `npm run lint` (`os/`) | Passing, zero warnings |
| Unit tests | `npm test` (`os/`) | 14 tests passing — RBAC matrix, segregation of duties, Zod schemas (client creation, sign-up), nav config integrity |
| Production build | `npm run build` (`os/`) | Succeeds, including without `DATABASE_URL` set (see `/docs/architecture.md` — lazy Prisma client) |
| Database migrations | `npx prisma migrate dev` against real Postgres 16 | Both migrations apply cleanly, including through Prisma's shadow-database validation |
| Row Level Security | Manual `psql` session, `SET ROLE authenticated` + `SET request.jwt.claim.sub` | Verified: cross-tenant isolation holds, anonymous session sees nothing, direct writes are rejected. See `/docs/security.md` and `/docs/setup.md` |
| Dev server smoke test | `next dev`, `curl` against `/`, `/dashboard`, `/login` | `/` and `/dashboard` correctly redirect unauthenticated requests to `/login?next=...`; `/login` renders 200 |

## What's not verified, and why

- **Full authenticated user flow (sign up → confirm email → sign in →
  see dashboard data)** — needs a real Supabase project; this sandbox has no
  Supabase instance to sign a real JWT against. Do this once the real
  project exists (`/docs/setup.md` walks through it) before calling Phase 0
  done-done.
- **Playwright end-to-end tests** — the dependency isn't even installed yet.
  Deferred rather than added half-configured: an E2E suite against a fake
  or mocked Supabase session tests less than it appears to. Once a real
  (or Supabase-local-dev) auth flow exists, add Playwright then, testing
  against it for real. Tracked in `/docs/implementation-plan.md`.
- **Accessibility** — components use semantic HTML, visible focus rings
  (`globals.css`), status badges that pair colour with a text label (not
  colour alone), and labelled form fields — but no automated a11y audit
  (axe, Lighthouse) has been run. Do this once there's a real deployed URL
  to point a tool at.
- **Load/performance** — no data volume exists yet to test against
  meaningfully (12 seed clients). Revisit when Work/Requests (Phase 1/2, the
  modules the brief calls "high-volume") are built — that's also when
  `@tanstack/react-table` (already installed, unused) gets wired in for
  server-side pagination.

## Acceptance criteria carried forward from the brief (Phase 0/1 scope only)

Only listing the ones actually testable against what's built — the rest
(quality gates, request SLAs, multi-currency billing, ...) belong to their
own phases and will get their own acceptance criteria when that phase's
design lands.

- [x] A client user — n/a yet, no client portal (Phase 2). Internal
      tenant isolation instead: **a signed-in member of one organization
      cannot see another organization's clients, memberships or audit
      events.** Verified via RLS (see above); application-layer query
      scoping is the enforced path and is covered by the shape of every
      function in `src/lib/queries/*.ts` (organizationId is a required,
      non-optional parameter — there's no call site that can omit it).
- [x] **Material actions appear in the audit log with actor, time, target.**
      `recordAuditEvent()` is called from sign-up, role change, and client
      creation; `os/src/lib/audit.ts`.
- [x] **Self-review is prevented.** `canReview()`, unit tested.
- [ ] Onboarding gates, recurring delivery, request SLAs, QA release gates,
      multi-currency billing — all Phase 1+ features not yet built; their
      acceptance criteria live in `/docs/implementation-plan.md` against
      the phase that ships them.

## CI

`.github/workflows/os-ci.yml` runs `typecheck`, `lint`, `test` and `build`
on every push/PR touching `os/**`. It does not run database-dependent
checks (no Postgres service in CI yet) — the RLS verification above is a
manual, documented, reproducible procedure (`/docs/setup.md`), not an
automated CI step. Adding a Postgres service container to CI so migrations
and RLS are checked on every push is a reasonable Phase 1 follow-up, noted
in `/docs/implementation-plan.md`.
