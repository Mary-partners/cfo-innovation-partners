"use client";

import { useActionState } from "react";
import {
  changeMemberRoleAction,
  type ChangeRoleState,
} from "@/app/(app)/settings/team/actions";
import { ROLE_LABELS, OrgRole } from "@/lib/auth/rbac";

const initialState: ChangeRoleState = {};

export function RoleSelectForm({
  membershipId,
  currentRole,
  disabled,
}: {
  membershipId: string;
  currentRole: OrgRole;
  disabled?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(changeMemberRoleAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="membershipId" value={membershipId} />
      <select
        name="role"
        defaultValue={currentRole}
        disabled={disabled || isPending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border border-navy-900/20 bg-white px-2 text-sm text-slate-text disabled:opacity-50"
      >
        {Object.values(OrgRole).map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      {state.error ? <span className="text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}
