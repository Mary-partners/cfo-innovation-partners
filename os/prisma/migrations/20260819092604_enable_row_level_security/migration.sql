-- Row Level Security.
--
-- What this does and does not protect (see /docs/security.md "Row Level
-- Security" for the full write-up): this is defense-in-depth for any
-- access path that authenticates as a real Supabase end user — a browser
-- Supabase client, or Supabase's PostgREST auto-API. The application
-- server queries through Prisma using the Supabase "postgres"/direct
-- connection role, which — like every Supabase project — bypasses RLS by
-- design. Tenant isolation on THAT path is enforced in application code:
-- every query is scoped by organizationId (see src/lib/queries/*.ts and
-- src/lib/auth/session.ts), and covered by src/tests/unit/rbac.test.ts.
-- Wiring RLS to also cover the Prisma connection path (by propagating the
-- signed-in user's JWT claims into each transaction) is tracked as a
-- reversible assumption in /docs/decision-log.md.

-- Supabase Postgres already ships `auth.uid()`. A plain local/CI/shadow
-- Postgres (used by `prisma migrate dev` and this repo's tests) does not,
-- so stub it — but only if it's genuinely missing, so this never touches
-- Supabase's real implementation in production.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE
      AS $fn$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $fn$;
  END IF;
END $$;

-- Supabase Postgres already ships an `authenticated` role. A plain
-- local/CI/shadow Postgres does not, so stub a harmless NOLOGIN one — the
-- GRANT below needs a role to target either way.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;

-- Policies below read `memberships` to decide what a user may see —
-- including the policy ON `memberships` itself. A policy that queries its
-- own table recursively re-triggers RLS evaluation and Postgres raises
-- "infinite recursion detected in policy". The fix is this SECURITY
-- DEFINER helper: it runs with the privileges of its owner (the migration
-- role, which owns the tables and is therefore exempt from their RLS), so
-- the membership lookup inside it never re-enters a policy.
CREATE OR REPLACE FUNCTION public.current_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "organizationId"
  FROM memberships
  WHERE "userId" = auth.uid()
    AND "isActive" = true;
$$;

REVOKE ALL ON FUNCTION public.current_org_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_org_ids() TO authenticated;

ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "client_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;

-- A signed-in user may see an organization only if they hold an active
-- membership in it.
CREATE POLICY "organizations_select_member" ON "organizations"
  FOR SELECT
  USING ("id" IN (SELECT public.current_org_ids()));

-- Members can see the roster of their own organization; never another
-- organization's members.
CREATE POLICY "memberships_select_same_org" ON "memberships"
  FOR SELECT
  USING ("organizationId" IN (SELECT public.current_org_ids()));

CREATE POLICY "clients_select_same_org" ON "clients"
  FOR SELECT
  USING ("organizationId" IN (SELECT public.current_org_ids()));

CREATE POLICY "client_contacts_select_same_org" ON "client_contacts"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "clients" c
      WHERE c."id" = "client_contacts"."clientId"
        AND c."organizationId" IN (SELECT public.current_org_ids())
    )
  );

CREATE POLICY "audit_events_select_same_org" ON "audit_events"
  FOR SELECT
  USING ("organizationId" IN (SELECT public.current_org_ids()));

-- No INSERT/UPDATE/DELETE policies are defined for the `authenticated`
-- role: all writes go through the application server, which enforces RBAC
-- (src/lib/auth/rbac.ts) before writing. RLS denies by default for any
-- statement type without a matching permissive policy, so a browser client
-- can never write directly even with a valid session.
