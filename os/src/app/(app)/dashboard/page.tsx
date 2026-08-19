import Link from "next/link";
import type { Metadata } from "next";
import { requireActor } from "@/lib/auth/session";
import { getPortfolioStats, getClientList } from "@/lib/queries/clients";
import { StatCard } from "@/components/os/stat-card";
import { LifecycleBadge, SERVICE_BUCKET_LABEL } from "@/components/os/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Command Centre" };

export default async function DashboardPage() {
  const actor = await requireActor();
  const [stats, clients] = await Promise.all([
    getPortfolioStats(actor.organizationId),
    getClientList(actor.organizationId),
  ]);

  const recentClients = clients.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Command Centre</h1>
        <p className="text-sm text-slate-text/70">
          Portfolio snapshot for CFO Innovation Partners.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={stats.total} />
        <StatCard label="Onboarding" value={stats.onboardingCount} hint="In the onboarding lifecycle stage" />
        <StatCard label="Active" value={stats.activeCount} hint="Active recurring delivery" />
        <StatCard
          label="Watch / At risk"
          value={stats.watchCount + stats.atRiskCount}
          hint="Needs relationship attention"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Clients by service</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-2">
            {stats.byServiceBucket.length === 0 ? (
              <p className="text-sm text-slate-text/60">No clients yet.</p>
            ) : (
              stats.byServiceBucket.map((row) => (
                <div key={row.bucket} className="flex items-center justify-between text-sm">
                  <span className="text-slate-text">
                    {SERVICE_BUCKET_LABEL[row.bucket] ?? row.bucket}
                  </span>
                  <span className="font-medium text-navy-900">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recently updated clients</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {recentClients.length === 0 ? (
              <p className="text-sm text-slate-text/60">
                No clients yet.{" "}
                <Link href="/clients" className="font-medium text-navy-900 underline">
                  Add your first client
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-navy-900/5">
                {recentClients.map((client) => (
                  <li key={client.id} className="flex items-center justify-between py-2.5">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-sm font-medium text-navy-900 hover:underline"
                    >
                      {client.name}
                    </Link>
                    <LifecycleBadge stage={client.lifecycleStage} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
