import { ROLE_LABELS, type OrgRole } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";

export function Topbar({ email, role }: { email: string; role: OrgRole }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-navy-900/10 bg-white px-6">
      <div />
      <div className="flex items-center gap-3">
        <Badge tone="gold">{ROLE_LABELS[role]}</Badge>
        <span className="text-sm text-slate-text/70">{email}</span>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="rounded-md border border-navy-900/15 px-3 py-1.5 text-sm font-medium text-navy-900 hover:bg-navy-900/5"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
