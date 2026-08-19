"use client";

import { useActionState } from "react";
import { createClientAction, type CreateClientState } from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICE_BUCKET_LABEL } from "@/components/os/status-badge";

const initialState: CreateClientState = {};

export function NewClientForm({ onCreated }: { onCreated?: () => void }) {
  const [state, formAction, isPending] = useActionState(async (prev: CreateClientState, formData: FormData) => {
    const result = await createClientAction(prev, formData);
    if (!result.error && !result.fieldErrors) {
      onCreated?.();
    }
    return result;
  }, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Client name</Label>
        <Input id="name" name="name" required />
        {state.fieldErrors?.name ? (
          <p className="text-xs text-danger">{state.fieldErrors.name}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue="Kenya" required />
          {state.fieldErrors?.country ? (
            <p className="text-xs text-danger">{state.fieldErrors.country}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" name="currency" defaultValue="KES" maxLength={3} required />
          {state.fieldErrors?.currency ? (
            <p className="text-xs text-danger">{state.fieldErrors.currency}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="serviceBucket">Service portfolio</Label>
        <select
          id="serviceBucket"
          name="serviceBucket"
          required
          className="h-10 rounded-md border border-navy-900/20 bg-white px-3 text-sm text-slate-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          defaultValue=""
        >
          <option value="" disabled>
            Choose a portfolio bucket
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

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending ? "Adding…" : "Add client"}
      </Button>
    </form>
  );
}
