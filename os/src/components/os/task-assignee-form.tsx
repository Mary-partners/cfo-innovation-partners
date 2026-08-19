"use client";

import { useActionState } from "react";
import { assignTaskAction, type ActionState } from "@/app/(app)/work/actions";

const initialState: ActionState = {};

export function TaskAssigneeForm({
  taskId,
  currentAssigneeId,
  members,
  disabled,
}: {
  taskId: string;
  currentAssigneeId: string | null;
  members: { id: string; label: string }[];
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(assignTaskAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="assigneeMembershipId"
        defaultValue={currentAssigneeId ?? ""}
        disabled={disabled || isPending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border border-navy-900/20 bg-white px-2 text-sm text-slate-text disabled:opacity-50"
      >
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {state.error ? <span className="text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}
