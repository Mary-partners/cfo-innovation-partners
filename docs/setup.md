# Setup

Everything here happens in GitHub, Supabase and Vercel's dashboards, or in a
Claude Code session — nothing needs to run on your own laptop. The steps
that say "run this" can be run from any Claude Code session with this repo
checked out, exactly as this one did.

## 1. Create the Supabase project

1. [supabase.com](https://supabase.com) → New project. Pick a region close
   to Kenya (e.g. an EU region — Supabase has no African region yet).
2. Wait for provisioning, then go to **Project Settings → API** and note:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret —
     it bypasses every permission check)
3. Go to **Project Settings → Database → Connection string**:
   - Copy the **Transaction pooler** string (port `6543`) → `DATABASE_URL`.
     Append `?pgbouncer=true` if it isn't already there.
   - Copy the **Session/Direct** string (port `5432`) → `DIRECT_URL`.
   - Both contain your database password — set it if you haven't.

## 2. Apply the schema and enable Row Level Security

From this repo, in `os/`:

```bash
cp .env.example .env.local
# fill in the five values from step 1

npm install
npm run db:migrate:deploy   # prisma migrate deploy — applies both
                             # migrations (schema + RLS) in order
```

`db:migrate:deploy` runs `prisma migrate deploy`, which applies the
committed migrations as-is (no shadow database, no diffing) — the right
command against a real, already-designed database. Use `npm run db:migrate`
(`prisma migrate dev`) only if you're changing `schema.prisma` and need
Prisma to generate a *new* migration from the diff.

## 3. Seed demo data (optional, safe for a demo project)

```bash
npm run db:seed
```

Creates the CFOIP organization row and 12 fictional demo clients. Does
**not** create any user or membership — see the comment at the top of
`prisma/seed.ts` for why (it would break the first-sign-up-becomes-Managing-
Partner bootstrap described below).

## 4. First sign-in

1. Deploy to Vercel (step 6) or run `npm run dev` against the real Supabase
   project (with `.env.local` filled in) to get the app in front of a
   browser.
2. Go to `/signup`, create an account with your real email.
3. Supabase emails a confirmation link (check spam if it doesn't arrive
   within a minute) → click it → lands on `/dashboard`.
4. Because you're the first person to sign in to a fresh organization, your
   `Membership` role is automatically `MANAGING_PARTNER`
   (`src/lib/auth/session.ts`). Everyone who signs up after you defaults to
   `PREPARER_ANALYST` — promote them from **Settings → Team**.

## 5. Verifying migrations and RLS locally (optional, for changes to the schema)

This is exactly what was done to build and verify
`os/prisma/migrations/20260819092604_enable_row_level_security/`. Repeat it
whenever you change RLS policies, since Supabase-specific objects
(`auth.uid()`, the `authenticated` role) don't exist on a stock Postgres and
the migration file stubs them defensively — worth re-proving after any edit.

```bash
# Postgres 16 client+server are available in a Claude Code sandbox already;
# elsewhere, install postgresql-16 or run it in a container.
service postgresql start
su postgres -c "psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
su postgres -c "psql -c \"CREATE DATABASE cfoip_dev;\""

export DIRECT_URL="postgresql://postgres:postgres@localhost:5432/cfoip_dev"
export DATABASE_URL="$DIRECT_URL"

cd os
npx prisma migrate dev   # applies + validates both migrations via a shadow DB

# Seed two organizations, two users, two clients to prove isolation:
su postgres -c "psql -d cfoip_dev" <<'SQL'
INSERT INTO organizations (id, name, slug, "createdAt", "updatedAt") VALUES
  ('11111111-1111-1111-1111-111111111111','Org A','org-a', now(), now()),
  ('22222222-2222-2222-2222-222222222222','Org B','org-b', now(), now());
INSERT INTO memberships (id, "organizationId", "userId", email, role, "createdAt", "updatedAt") VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','99999999-9999-9999-9999-999999999999','a@example.com','MANAGING_PARTNER', now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222','88888888-8888-8888-8888-888888888888','b@example.com','MANAGING_PARTNER', now(), now());
INSERT INTO clients (id, "organizationId", name, country, currency, "serviceBucket", "createdAt", "updatedAt") VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc','11111111-1111-1111-1111-111111111111','Client of Org A','Kenya','KES','MONTHLY_CFO', now(), now()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd','22222222-2222-2222-2222-222222222222','Client of Org B','Kenya','KES','MONTHLY_CFO', now(), now());
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
SQL

# Impersonate user A and confirm they see only Org A's client:
su postgres -c "psql -d cfoip_dev" <<'SQL'
SET ROLE authenticated;
SET request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';
SELECT name FROM clients;   -- expect exactly "Client of Org A"
SQL
```

## 6. Connect Vercel

Vercel isn't something a Claude Code session can do on your behalf (no API
credentials for it are available here) — do this once, in the Vercel
dashboard:

1. **Add New… → Project**, import `mary-partners/cfo-innovation-partners`
   from GitHub.
2. **Root Directory**: set to `os` (this is what makes Vercel build only the
   Next.js app, ignoring the marketing site at the repo root).
3. Framework preset: Next.js (auto-detected).
4. **Environment Variables**: add all six from `.env.example` with your real
   Supabase values, for the Production (and Preview, if you want PR
   previews to work against the same project) environment.
5. Deploy. Vercel gives you a `*.vercel.app` URL immediately; add a custom
   domain (e.g. `os.cfoinnovationpartners.com`) under **Project Settings →
   Domains** once you're ready.
6. **Update the marketing site's nav link**: `index.html`'s "Access your OS"
   link currently points to `https://os.cfoinnovationpartners.com` as a
   placeholder — change it to whatever domain you actually land on (the
   `*.vercel.app` URL, or your custom domain once DNS is live) and push.

From here on, every push to the branch Vercel is watching redeploys the OS
automatically — no manual deploy step, matching "everything on GitHub and
Vercel, nothing local."

## Everyday commands (`os/`)

```bash
npm run dev              # local dev server (needs .env.local)
npm run build             # production build
npm run typecheck
npm run lint
npm test
npm run db:studio         # Prisma Studio — browse the database visually
```
