"use client";

import { useActionState } from "react";
import { startDemo, type DemoActionState } from "@/app/demo/actions";

/** Starts (or resumes) a demo as the given role. Works before hydration. */
export function StartDemoButton({
  role,
  className,
  children,
}: {
  role: "client" | "artist";
  className: string;
  children: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<DemoActionState, FormData>(startDemo, null);
  return (
    <form action={action}>
      <input type="hidden" name="role" value={role} />
      <button disabled={pending} aria-busy={pending} className={className}>
        {pending ? "Setting up your demo…" : children}
      </button>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
