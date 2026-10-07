"use client";

import { useActionState } from "react";
import { exitDemo, switchDemoRole } from "@/app/demo/actions";

export function DemoBarActions({ role }: { role: "client" | "artist" }) {
  const [switchState, switchAction, switching] = useActionState(switchDemoRole, null);
  const [, exitAction, exiting] = useActionState(exitDemo, undefined);
  const busy = switching || exiting;

  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      {switchState?.error && (
        <span role="alert" className="hidden text-accent sm:inline">
          {switchState.error}
        </span>
      )}
      <form action={switchAction}>
        <button
          disabled={busy}
          className="rounded-md px-2 py-1 font-medium text-primary underline-offset-4 transition-colors hover:underline disabled:opacity-60"
        >
          {switching ? (
            "Switching…"
          ) : (
            <>
              Switch to {role === "artist" ? "client" : "artist"}
              <span className="hidden sm:inline"> view</span>
            </>
          )}
        </button>
      </form>
      <span aria-hidden className="text-neutral-light/30">
        |
      </span>
      <form action={exitAction}>
        <button
          disabled={busy}
          className="rounded-md px-2 py-1 text-neutral-light/70 transition-colors hover:text-neutral-light disabled:opacity-60"
        >
          {exiting ? "Exiting…" : "Exit"}
        </button>
      </form>
    </div>
  );
}
