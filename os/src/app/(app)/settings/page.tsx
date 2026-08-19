import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/auth/rbac";

export const metadata: Metadata = { title: "Settings" };

const ROADMAP = [
  {
    phase: "Phase 0 — Foundation",
    status: "live" as const,
    items: ["Authentication (Supabase)", "Organization & RBAC model", "Audit trail", "Design system", "CI (lint/typecheck/test/build)"],
  },
  {
    phase: "Phase 1 — Operational MVP",
    status: "in-progress" as const,
    items: ["Client portfolio & Client 360", "Command Centre", "Workflow templates & recurring work", "Deadlines calendar", "Internal documents"],
  },
  {
    phase: "Phase 2 — Service control",
    status: "planned" as const,
    items: ["Client portal", "Ad hoc requests", "Quality review & approval", "Meetings & decisions", "Capacity planning"],
  },
  {
    phase: "Phase 3 — Commercial management",
    status: "planned" as const,
    items: ["Time & timesheets", "Budgets & retainers", "Invoicing & collections", "Realisation & profitability"],
  },
  {
    phase: "Phase 4 — Integrations & intelligence",
    status: "planned" as const,
    items: ["Accounting/email/calendar/e-sign/payment adapters", "Advanced automation", "Client health scoring", "Forecasting"],
  },
];

const STATUS_LABEL: Record<(typeof ROADMAP)[number]["status"], string> = {
  live: "Live",
  "in-progress": "In progress",
  planned: "Planned",
};

const STATUS_TONE: Record<(typeof ROADMAP)[number]["status"], "success" | "info" | "neutral"> = {
  live: "success",
  "in-progress": "info",
  planned: "neutral",
};

export default async function SettingsPage() {
  const actor = await requireActor();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Settings & Security</h1>
        <p className="text-sm text-slate-text/70">
          Signed in as {actor.email} — {ROLE_LABELS[actor.membership.role]}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team & access</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-slate-text/70">
            Manage who has access and their internal role.
          </p>
          <Link href="/settings/team" className="mt-2 inline-block text-sm font-medium text-navy-900 underline">
            Go to Team →
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build roadmap</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-2">
          {ROADMAP.map((entry) => (
            <div key={entry.phase} className="border-b border-navy-900/5 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-navy-900">{entry.phase}</h3>
                <Badge tone={STATUS_TONE[entry.status]}>{STATUS_LABEL[entry.status]}</Badge>
              </div>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {entry.items.map((item) => (
                  <li key={item} className="rounded-full bg-navy-900/5 px-2.5 py-1 text-xs text-slate-text">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-slate-text/50">
            Full detail, acceptance criteria and sequencing: /docs/implementation-plan.md
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
