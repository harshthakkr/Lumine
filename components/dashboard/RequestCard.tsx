import type { DashboardBooking } from "@/lib/queries/bookings";
import { formatDay, formatPrice, formatRelative, formatTimeRange } from "@/lib/format";
import { Avatar } from "../ui/Avatar";
import { RespondButtons } from "./RespondButtons";

export function RequestCard({ booking, timeZone }: { booking: DashboardBooking; timeZone: string }) {
  return (
    <li className="animate-rise rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={booking.clientName} src={booking.clientImage} size={40} />
          <div className="min-w-0">
            <p className="truncate font-medium">{booking.clientName}</p>
            <p className="text-xs text-ink-muted">Requested {formatRelative(booking.createdAt)}</p>
          </div>
        </div>
        <p className="shrink-0 font-playfair-display text-xl">{formatPrice(booking.priceCents)}</p>
      </div>

      <dl className="mb-4 grid gap-1 text-sm">
        <div className="flex gap-2">
          <dt className="sr-only">Service</dt>
          <dd className="font-medium">{booking.serviceName}</dd>
        </div>
        <div className="flex gap-2 text-ink-muted">
          <dt className="sr-only">When</dt>
          <dd>
            {formatDay(booking.startsAt, timeZone)} ·{" "}
            {formatTimeRange(booking.startsAt, booking.endsAt, timeZone)}
          </dd>
        </div>
        <div className="flex gap-2 text-ink-muted">
          <dt className="sr-only">Where</dt>
          <dd>{booking.location === "studio" ? "At your studio" : booking.address}</dd>
        </div>
      </dl>

      {booking.notes && (
        <blockquote className="mb-4 rounded-xl bg-secondary/40 px-4 py-3 text-sm text-neutral-dark/80">
          &ldquo;{booking.notes}&rdquo;
        </blockquote>
      )}

      <RespondButtons bookingId={booking.id} />
    </li>
  );
}
