"use client";

import { useActionState } from "react";
import { respondToBookingRequest, type RespondState } from "@/app/dashboard/actions";
import { buttonStyles } from "../ui/button";

/** Accept / decline controls for a pending request. */
export function RespondButtons({ bookingId, size = "sm" }: { bookingId: string; size?: "sm" | "md" }) {
  const [state, action, pending] = useActionState<RespondState, FormData>(respondToBookingRequest, null);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <button name="decision" value="accept" disabled={pending} className={buttonStyles({ size, className: "px-5" })}>
        {pending ? "Saving…" : "Accept"}
      </button>
      <button
        name="decision"
        value="decline"
        disabled={pending}
        className={buttonStyles({ variant: "danger", size, className: "px-5" })}
      >
        Decline
      </button>
      {state && !state.ok && (
        <p role="alert" className="ml-1 text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
