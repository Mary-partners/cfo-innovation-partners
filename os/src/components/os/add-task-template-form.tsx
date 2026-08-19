"use client";

import { useActionState } from "react";
import { addTaskTemplateAction, type ActionState } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

export function AddTaskTemplateForm({
  workflowTemplateId,
  nextOrder,
}: {
  workflowTemplateId: string;
  nextOrder: number;
}) {
  const [state, formAction, isPending] = useActionState(addTaskTemplateAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="workflowTemplateId" value={workflowTemplateId} />
      <input type="hidden" name="order" value={nextOrder} />

      {state.error ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Task title</Label>
        <Input id="title" name="title" placeholder="e.g. Reconcile bank accounts" required />
        {state.fieldErrors?.title ? (
          <p className="text-xs text-danger">{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="relativeDueDays">Due, days into the period</Label>
        <Input
          id="relativeDueDays"
          name="relativeDueDays"
          type="number"
          min={0}
          defaultValue={0}
          required
        />
        {state.fieldErrors?.relativeDueDays ? (
          <p className="text-xs text-danger">{state.fieldErrors.relativeDueDays}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={isPending} size="sm" className="self-start">
        {isPending ? "Adding…" : "Add task"}
      </Button>
    </form>
  );
}
