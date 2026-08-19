import { requireActor } from "@/lib/auth/session";
import { Sidebar } from "@/components/os/sidebar";
import { Topbar } from "@/components/os/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar email={actor.email} role={actor.membership.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
