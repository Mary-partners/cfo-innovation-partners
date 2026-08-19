# Architecture

## Repository layout

This is one GitHub repository holding two independently deployed things:

```
/                     Marketing site — static HTML/CSS/JS, deployed to
                       GitHub Pages via .github/workflows/pages.yml
  index.html
  styles.css
  script.js

/os                    CFOIP OS — Next.js app, deployed to Vercel with
                       "Root Directory" set to os/ in the Vercel project
  src/app/              App Router routes
  src/components/       UI components
  src/lib/               Server-only helpers (db, auth, rbac, queries)
  prisma/                Schema, migrations, seed script

/docs                  This directory — practice-wide documentation
```

Two deployments from one repo is deliberate: the marketing site works today
on GitHub Pages and there's no reason to disturb it. The OS needs a
Node.js/serverless runtime (auth, database, server actions) that GitHub
Pages can't provide, so it's a second Vercel project pointed at the same
repo with `os/` as its root directory. Nothing runs or is deployed from a
local machine — both deployments are triggered by pushes to GitHub
(GitHub Actions for Pages, Vercel's own GitHub integration for the OS).

## Why a subdirectory instead of one Next.js app

An earlier option was folding the marketing site into the Next.js app as
static pages. Rejected for now: it would mean hand-translating ~700 lines of
hand-tuned marketing HTML into JSX with real risk of visual regressions, for
no functional benefit — the marketing site has no dynamic behaviour Next.js
would add. Keeping it as-is and shipping the OS as a sibling app is lower
risk and ships faster. Revisit only if there's a concrete reason (e.g.
wanting the marketing site and OS on the same domain without a reverse
proxy) — tracked in `/docs/decision-log.md`.

## OS application stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) | SSR, Server Actions, and Vercel's native deployment target |
| Auth | Supabase Auth via `@supabase/ssr` | Handles password hashing, session cookies, email confirmation; no auth code to maintain |
| Database | Supabase Postgres | Managed Postgres with Row Level Security available for defense-in-depth |
| ORM | Prisma 7 (driver adapters, `@prisma/adapter-pg`) | Typed queries and migrations; adapter model needed because Prisma 7 removed the classic `datasource.url` client config |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | No separate `tailwind.config.js`; brand tokens live in `globals.css` |
| Forms | React Hook Form + Zod | Client validation; server actions re-validate the same Zod schemas server-side |
| Tables | `@tanstack/react-table` (installed, not yet used) | Reserved for Work/Requests/Time — high-volume tables Phase 1+; the Phase 1 Clients list is small enough for a plain `<table>` today |
| Testing | Vitest + Testing Library (unit), Playwright (planned, not yet wired) | See `/docs/qa-plan.md` |

## Request flow

1. **`src/middleware.ts`** runs on every request (Edge runtime). It refreshes
   the Supabase session cookie and redirects unauthenticated requests away
   from anything under `(app)` to `/login`, and authenticated requests away
   from `/login`/`/signup` to `/dashboard`. It never touches the database —
   Edge runtime can't run `pg`/Prisma.
2. **`src/app/(app)/layout.tsx`** (Node.js runtime, Server Component) calls
   `requireActor()`, which resolves the Supabase user to an internal
   `Membership` row via Prisma — creating one on first sign-in (see
   "Single-tenant bootstrap" in `/docs/decision-log.md`).
3. Page Server Components call functions in `src/lib/queries/*.ts`, which
   query Prisma scoped explicitly by `organizationId`.
4. Mutations are Next.js Server Actions (`"use server"` files, e.g.
   `src/app/(app)/clients/actions.ts`) that re-check `can(role, permission)`
   from `src/lib/auth/rbac.ts` before writing, then write an `AuditEvent`.

## Database connection strategy

Supabase exposes two Postgres endpoints:

- **Pooled** (port 6543, PgBouncer transaction mode) — `DATABASE_URL`, used
  by the running app (`src/lib/db.ts`). Required in serverless/Vercel
  because each function invocation would otherwise open its own direct
  connection and exhaust Postgres' connection limit.
- **Direct** (port 5432) — `DIRECT_URL`, used only by `prisma migrate` via
  `prisma.config.ts`. Migrations need DDL-capable direct connections;
  PgBouncer transaction mode doesn't support that reliably.

`src/lib/db.ts` builds the Prisma client lazily behind a `Proxy` rather than
at module load time. Next.js's build-time "collect page data" step statically
imports every route module — including layouts — to inspect their config,
which would otherwise construct a `pg.Pool` (and fail fast on a missing
`DATABASE_URL`) purely from being imported, even for a route that never
queries the database. Verified: `next build` succeeds without `DATABASE_URL`
set (see `os/README.md`).

## Deployment topology

```
GitHub (mary-partners/cfo-innovation-partners)
 ├─ push to main ─▶ GitHub Actions (.github/workflows/pages.yml)
 │                    └─▶ GitHub Pages: marketing site
 └─ push to main ─▶ Vercel Git integration (root directory: os/)
                      └─▶ Vercel: CFOIP OS (Next.js, Node.js runtime)
                            └─▶ Supabase (Postgres + Auth)
```

Vercel connection is external to this repo (project import + env vars done
in the Vercel dashboard) — see `/docs/setup.md` for the exact steps, since
neither this session nor future ones have Vercel API credentials to do it
programmatically.

## Multi-tenancy

The schema is organization-scoped (`Organization` → `Membership`/`Client` →
...) even though the product only exposes one organization today (CFOIP
itself). See `/docs/decision-log.md` — "Single-tenant bootstrap" — for why,
and `/docs/security.md` — "Tenant isolation" — for how it's enforced.
