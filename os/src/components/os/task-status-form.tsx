"use client";

import { useActionState } from "react";
import { updateTaskStatusAction, type ActionState } from "@/app/(app)/work/actions";
import { TASK_STATUS_LABEL, TASK_STATUS_ORDER } from "@/lib/workflow/status";
import type { TaskStatus } from "@/generated/prisma/enums";

const initialState: ActionState = {};

export function TaskStatusForm({
  taskId,
  currentStatus,
  disabled,
}: {
  taskId: string;
  currentStatus: TaskStatus;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateTaskStatusAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        defaultValue={currentStatus}
        disabled={disabled || isPending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border border-navy-900/20 bg-white px-2 text-sm text-slate-text disabled:opacity-50"
      >
        {TASK_STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {TASK_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
      {state.error ? <span className="text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}
