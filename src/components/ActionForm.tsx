"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/lib/types";

type Props = {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  submit: string;
  children?: ReactNode;
  resetOnSuccess?: boolean;
  className?: string;
};

// One form used everywhere: shows a loading button plus error and success messages.
export default function ActionForm({ action, submit, children, resetOnSuccess, className = "form" }: Props) {
  const [state, run, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      method="post"
      className={className}
      onSubmit={(event) => {
        // Submitting manually keeps what was typed when there is an error.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => run(data));
      }}
    >
      {children}
      {state.error && <p className="message error" role="alert">{state.error}</p>}
      {state.success && <p className="message success" role="status">{state.success}</p>}
      <button className="button" disabled={pending}>{pending ? "Please wait…" : submit}</button>
    </form>
  );
}
