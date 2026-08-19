import type { Metadata } from "next";
import Link from "next/link";
import { requireActor } from "@/lib/auth/session";
import { getUpcomingTasks } from "@/lib/queries/workflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskStatusBadge } from "@/components/os/workflow-status-badge";
import { computeIsOverdue } from "@/lib/workflow/status";

export const metadata: Metadata = { title: "Calendar & Deadlines" };

const DAY_MS = 24 * 60 * 60 * 1000;

type Bucket = { label: string; tasks: Awaited<ReturnType<typeof getUpcomingTasks>> };

function bucketize(tasks: Awaited<ReturnType<typeof getUpcomingTasks>>): Bucket[] {
  const now = Date.now();
  const buckets: Bucket[] = [
    { label: "Overdue", tasks: [] },
    { label: "Next 7 days", tasks: [] },
    { label: "Next 14 days", tasks: [] },
    { label: "Next 30 days", tasks: [] },
    { label: "Later", tasks: [] },
  ];

  for (const task of tasks) {
    const daysOut = (new Date(task.dueDate).getTime() - now) / DAY_MS;
    if (computeIsOverdue(task)) buckets[0]!.tasks.push(task);
    else if (daysOut <= 7) buckets[1]!.tasks.push(task);
    else if (daysOut <= 14) buckets[2]!.tasks.push(task);
    else if (daysOut <= 30) buckets[3]!.tasks.push(task);
    else buckets[4]!.tasks.push(task);
  }

  return buckets;
}

export default async function CalendarPage() {
  const actor = await requireActor();
  const tasks = await getUpcomingTasks(actor.organizationId);
  const buckets = bucketize(tasks);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Calendar & Deadlines</h1>
        <p className="text-sm text-slate-text/70">
          {tasks.length} open task{tasks.length === 1 ? "" : "s"} across the portfolio.
        </p>
      </div>

      {buckets
        .filter((bucket) => bucket.tasks.length > 0)
        .map((bucket) => (
          <Card key={bucket.label}>
            <CardHeader>
              <CardTitle>
                {bucket.label} ({bucket.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-navy-900/5">
                {bucket.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <Link
                        href={`/work/${task.workflowInstance.id}`}
                        className="text-sm font-medium text-navy-900 hover:underline"
                      >
                        {task.title}
                      </Link>
                      <div className="text-xs text-slate-text/50">
                        {task.workflowInstance.client.name} · {task.workflowInstance.name} · due{" "}
                        {new Date(task.dueDate).toLocaleDateString()}
                        {task.assignee
                          ? ` · ${task.assignee.displayName ?? task.assignee.email}`
                          : " · unassigned"}
                      </div>
                    </div>
                    <TaskStatusBadge task={task} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-text/60">
            No open tasks. Start some work from the{" "}
            <Link href="/work" className="underline">
              Work
            </Link>{" "}
            page.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
