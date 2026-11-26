"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/types";

export default function DeleteButton({ action }: { action: () => Promise<ActionState> }) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form
      action={run}
      onSubmit={(event) => {
        if (!confirm("Delete this ticket permanently?")) event.preventDefault();
      }}
    >
      <button className="button danger" disabled={pending}>{pending ? "Deleting…" : "Delete"}</button>
      {state.error && <p className="message error" role="alert">{state.error}</p>}
    </form>
  );
}
