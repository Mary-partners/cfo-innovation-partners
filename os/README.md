# CFOIP OS

CFO Innovation Partners' practice operating system. Next.js 16 (App
Router, TypeScript) + Supabase (auth, Postgres) + Prisma 7. Deployed to
Vercel with this directory (`os/`) as the project's Root Directory — see
[`/docs/setup.md`](../docs/setup.md) for the full walkthrough, including
creating the Supabase project and connecting Vercel.

Full documentation lives at [`/docs`](../docs) (repo root), not in this
directory — this README is just the local command reference.

## Requirements

- Node.js 22+
- A Supabase project (`/docs/setup.md` step 1) — or a local Postgres for
  schema/RLS work only (`/docs/setup.md` step 5), which doesn't need
  Supabase at all.

## Commands

```bash
npm install               # also runs `prisma generate` (postinstall)
cp .env.example .env.local  # fill in your Supabase values

npm run dev                # local dev server, http://localhost:3000
npm run build               # production build
npm run start                # run a production build locally

npm run typecheck
npm run lint
npm test                     # vitest run
npm run test:watch

npm run db:migrate           # prisma migrate dev — generates + applies a new migration
npm run db:migrate:deploy    # prisma migrate deploy — applies committed migrations as-is
npm run db:seed              # fictional demo clients (safe for a demo project)
npm run db:studio            # Prisma Studio — browse the database
```

## Project layout

```
src/
  app/
    (auth)/           /login, /signup — public
    (app)/             everything behind auth — layout calls requireActor()
    auth/               /auth/callback (email confirm), /auth/sign-out
  components/
    ui/                 Button, Card, Badge, Input, Label — small, hand-written
    os/                 Sidebar, Topbar, StatCard, status badges, etc.
    auth/                Login/signup forms
  lib/
    supabase/            Browser + server Supabase clients
    auth/                 rbac.ts (permission matrix), session.ts (actor resolution)
    queries/               Prisma queries, always scoped by organizationId
    db.ts                  Lazy Prisma client (driver adapter, see /docs/architecture.md)
    audit.ts                Append-only audit log writer
    validation/               Zod schemas shared by client forms and server actions
  middleware.ts            Session refresh + route protection (Edge runtime)
  tests/unit/                Vitest unit tests
prisma/
  schema.prisma
  migrations/
  seed.ts
```

## Why some nav items say "Soon"

Every item in the left nav is a real route. Items not yet built render a
placeholder explaining which phase ships them (`src/components/os/
placeholder.tsx`), rather than a broken link or a fake screen with mock
data — see [`/docs/implementation-plan.md`](../docs/implementation-plan.md).
