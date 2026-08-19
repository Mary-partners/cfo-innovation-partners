import type { Metadata } from "next";
import { requireActor } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can, ROLE_LABELS } from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelectForm } from "@/components/os/role-select-form";

export const metadata: Metadata = { title: "Team" };

export default async function TeamSettingsPage() {
  const actor = await requireActor();
  const canChangeRole = can(actor.membership.role, "membership:changeRole");

  const members = await db.membership.findMany({
    where: { organizationId: actor.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Team</h1>
        <p className="text-sm text-slate-text/70">
          Everyone who has signed in to CFOIP OS, and their internal role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy-900/10 text-xs uppercase tracking-wide text-slate-text/50">
                <th scope="col" className="px-5 py-3 font-medium">
                  Member
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/5">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-navy-900">
                      {member.displayName ?? member.email}
                    </div>
                    <div className="text-xs text-slate-text/50">{member.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    {canChangeRole ? (
                      <RoleSelectForm
                        membershipId={member.id}
                        currentRole={member.role}
                        disabled={member.id === actor.membership.id}
                      />
                    ) : (
                      ROLE_LABELS[member.role]
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
