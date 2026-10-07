import type { bookingStatus } from "@/db/schema";

type Status = (typeof bookingStatus.enumValues)[number];

const STYLES: Record<Status, { label: string; className: string }> = {
  awaiting_payment: { label: "Awaiting payment", className: "bg-warning-soft text-warning" },
  requested: { label: "Awaiting artist", className: "bg-warning-soft text-warning" },
  confirmed: { label: "Confirmed", className: "bg-success-soft text-success" },
  completed: { label: "Completed", className: "bg-secondary/70 text-neutral-dark/70" },
  declined: { label: "Declined", className: "bg-danger-soft text-danger" },
  cancelled: { label: "Cancelled", className: "bg-neutral-dark/5 text-ink-muted" },
  expired: { label: "Expired", className: "bg-neutral-dark/5 text-ink-muted" },
};

// The same state reads differently depending on whose move it is.
const ARTIST_LABELS: Partial<Record<Status, string>> = { requested: "Needs your reply" };

export function StatusPill({
  status,
  label,
  viewer = "client",
}: {
  status: Status;
  label?: string;
  viewer?: "client" | "artist";
}) {
  const style = STYLES[status];
  label ??= viewer === "artist" ? ARTIST_LABELS[status] : undefined;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}
    >
      {label ?? style.label}
    </span>
  );
}
