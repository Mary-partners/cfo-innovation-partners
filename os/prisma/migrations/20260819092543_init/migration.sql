-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('MANAGING_PARTNER', 'PRACTICE_ADMIN', 'PORTFOLIO_LEAD', 'RELATIONSHIP_MANAGER', 'SERVICE_LEAD', 'PREPARER_ANALYST', 'INDEPENDENT_REVIEWER', 'FINANCE_BILLING', 'READ_ONLY_AUDITOR');

-- CreateEnum
CREATE TYPE "ClientLifecycleStage" AS ENUM ('PROSPECT', 'ONBOARDING', 'ACTIVE', 'WATCH', 'AT_RISK', 'RENEWING', 'PAUSED', 'OFFBOARDING', 'OFFBOARDED');

-- CreateEnum
CREATE TYPE "ClientHealthStatus" AS ENUM ('HEALTHY', 'WATCH', 'AT_RISK');

-- CreateEnum
CREATE TYPE "ServiceBucket" AS ENUM ('MONTHLY_CFO', 'BOOKKEEPING_OVERSIGHT', 'CASH_FLOW_ADVISORY', 'INVESTOR_READINESS', 'AD_HOC_PROJECTS');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_SIGNED_UP', 'USER_SIGNED_IN', 'MEMBERSHIP_ROLE_CHANGED', 'MEMBERSHIP_DEACTIVATED', 'CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_LIFECYCLE_CHANGED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "OrgRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tradingName" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "serviceBucket" "ServiceBucket" NOT NULL,
    "lifecycleStage" "ClientLifecycleStage" NOT NULL DEFAULT 'PROSPECT',
    "healthScore" INTEGER,
    "healthStatus" "ClientHealthStatus",
    "portfolioLeadId" UUID,
    "relationshipOwnerId" UUID,
    "reportingYearEnd" TEXT,
    "engagementStartDate" TIMESTAMP(3),
    "engagementEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorMembershipId" UUID,
    "actorLabel" TEXT,
    "action" "AuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "memberships_organizationId_role_idx" ON "memberships"("organizationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_organizationId_userId_key" ON "memberships"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "clients_organizationId_lifecycleStage_idx" ON "clients"("organizationId", "lifecycleStage");

-- CreateIndex
CREATE INDEX "clients_organizationId_serviceBucket_idx" ON "clients"("organizationId", "serviceBucket");

-- CreateIndex
CREATE INDEX "client_contacts_clientId_idx" ON "client_contacts"("clientId");

-- CreateIndex
CREATE INDEX "audit_events_organizationId_createdAt_idx" ON "audit_events"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_portfolioLeadId_fkey" FOREIGN KEY ("portfolioLeadId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_relationshipOwnerId_fkey" FOREIGN KEY ("relationshipOwnerId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorMembershipId_fkey" FOREIGN KEY ("actorMembershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
