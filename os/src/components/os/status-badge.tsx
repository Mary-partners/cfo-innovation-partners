import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { ClientLifecycleStage, ClientHealthStatus } from "@/generated/prisma/enums";

const LIFECYCLE_LABEL: Record<ClientLifecycleStage, string> = {
  PROSPECT: "Prospect",
  ONBOARDING: "Onboarding",
  ACTIVE: "Active",
  WATCH: "Watch",
  AT_RISK: "At risk",
  RENEWING: "Renewing",
  PAUSED: "Paused",
  OFFBOARDING: "Offboarding",
  OFFBOARDED: "Offboarded",
};

const LIFECYCLE_TONE: Record<ClientLifecycleStage, BadgeProps["tone"]> = {
  PROSPECT: "neutral",
  ONBOARDING: "info",
  ACTIVE: "success",
  WATCH: "warning",
  AT_RISK: "danger",
  RENEWING: "gold",
  PAUSED: "neutral",
  OFFBOARDING: "neutral",
  OFFBOARDED: "neutral",
};

export function LifecycleBadge({ stage }: { stage: ClientLifecycleStage }) {
  return <Badge tone={LIFECYCLE_TONE[stage]}>{LIFECYCLE_LABEL[stage]}</Badge>;
}

const HEALTH_LABEL: Record<ClientHealthStatus, string> = {
  HEALTHY: "Healthy",
  WATCH: "Watch",
  AT_RISK: "At risk",
};

const HEALTH_TONE: Record<ClientHealthStatus, BadgeProps["tone"]> = {
  HEALTHY: "success",
  WATCH: "warning",
  AT_RISK: "danger",
};

export function HealthBadge({ status }: { status: ClientHealthStatus | null | undefined }) {
  if (!status) {
    return <Badge tone="neutral">Not scored</Badge>;
  }
  return <Badge tone={HEALTH_TONE[status]}>{HEALTH_LABEL[status]}</Badge>;
}

export const SERVICE_BUCKET_LABEL: Record<string, string> = {
  MONTHLY_CFO: "Monthly CFO",
  BOOKKEEPING_OVERSIGHT: "Bookkeeping Oversight",
  CASH_FLOW_ADVISORY: "Cash-flow Advisory",
  INVESTOR_READINESS: "Investor Readiness",
  AD_HOC_PROJECTS: "Ad Hoc Projects",
};
