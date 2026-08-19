"use client";

import { useActionState } from "react";
import { createWorkflowTemplateAction, type ActionState } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICE_BUCKET_LABEL } from "@/components/os/status-badge";
import { RECURRENCE_LABEL } from "@/lib/workflow/period";

const initialState: ActionState = {};

export function NewTemplateForm() {
  const [state, formAction, isPending] = useActionState(createWorkflowTemplateAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Template name</Label>
        <Input id="name" name="name" placeholder="e.g. Monthly Management Accounts" required />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-danger">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          name="description"
          rows={2}
          className="rounded-md border border-navy-900/20 bg-white px-3 py-2 text-sm text-slate-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="serviceBucket">Service portfolio</Label>
          <select
            id="serviceBucket"
            name="serviceBucket"
            required
            defaultValue=""
            className="h-10 rounded-md border border-navy-900/20 bg-white px-3 text-sm text-slate-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <option value="" disabled>
              Choose one
            </option>
            {Object.entries(SERVICE_BUCKET_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.serviceBucket ? (
            <p className="text-xs text-danger">{state.fieldErrors.serviceBucket}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recurrence">Recurs</Label>
          <select
            id="recurrence"
            name="recurrence"
            required
            defaultValue=""
            className="h-10 rounded-md border border-navy-900/20 bg-white px-3 text-sm text-slate-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <option value="" disabled>
              Choose one
            </option>
            {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.recurrence ? (
            <p className="text-xs text-danger">{state.fieldErrors.recurrence}</p>
          ) : null}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Creating…" : "Create template"}
      </Button>
    </form>
  );
}
