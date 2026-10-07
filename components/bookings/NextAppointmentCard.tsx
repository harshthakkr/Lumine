import Link from "next/link";
import { routes } from "@/lib/routes";
import type { ClientBooking } from "@/lib/queries/bookings";
import { formatDay, formatPrice, formatRelative, formatTimeRange } from "@/lib/format";
import { Avatar } from "../ui/Avatar";
import { StatusPill } from "../ui/StatusPill";
import { DateBadge } from "./DateBadge";

export function locationLabel(booking: ClientBooking) {
  return booking.location === "studio"
    ? `${booking.artist.name.split(" ")[0]}’s studio · ${booking.artist.neighborhood}`
    : (booking.address ?? "Your location");
}

/** The single next appointment, given pride of place. */
export function NextAppointmentCard({ booking }: { booking: ClientBooking }) {
  const tz = booking.artist.timezone;
  return (
    <Link
      href={routes.booking(booking.reference)}
      className="block animate-rise overflow-hidden rounded-2xl bg-neutral-dark text-neutral-light transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <DateBadge date={booking.startsAt} timeZone={tz} tone="dark" />
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs tracking-widest text-primary uppercase">
            Next appointment · {formatRelative(booking.startsAt)}
          </p>
          <h2 className="mb-2 font-playfair-display text-2xl sm:text-3xl">{booking.serviceName}</h2>
          <p className="text-sm text-neutral-light/75">
            {formatDay(booking.startsAt, tz)} · {formatTimeRange(booking.startsAt, booking.endsAt, tz)}
          </p>
          <p className="text-sm text-neutral-light/75">{locationLabel(booking)}</p>
        </div>
        <div className="flex items-center gap-3 border-t border-neutral-light/10 pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <Avatar name={booking.artist.name} src={booking.artist.avatarUrl} size={48} />
          <div className="text-sm">
            <p className="font-medium">{booking.artist.name}</p>
            <p className="text-neutral-light/60">Your artist</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-light/10 bg-neutral-light/5 px-6 py-3 text-xs sm:px-8">
        <span className="text-neutral-light/60">
          Ref <span className="font-mono tracking-wider text-neutral-light/90">{booking.reference}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-neutral-light/80">{formatPrice(booking.priceCents)}</span>
          <StatusPill status={booking.status} />
        </span>
      </div>
    </Link>
  );
}
