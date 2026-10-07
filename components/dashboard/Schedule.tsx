import Link from "next/link";
import { routes } from "@/lib/routes";
import type { DashboardBooking } from "@/lib/queries/bookings";
import { formatDay, formatPrice, formatTimeRange } from "@/lib/format";
import { toLocalDate } from "@/lib/time";
import { Avatar } from "../ui/Avatar";

export function Schedule({ bookings, timeZone }: { bookings: DashboardBooking[]; timeZone: string }) {
  if (!bookings.length) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
        Nothing booked in the next two weeks.
      </p>
    );
  }

  const today = toLocalDate(new Date(), timeZone);
  const byDay = Map.groupBy(bookings, (b) => toLocalDate(b.startsAt, timeZone));

  return (
    <ol className="space-y-6">
      {[...byDay].map(([day, items]) => (
        <li key={day}>
          <h3 className="mb-2 text-xs font-medium tracking-widest text-ink-muted uppercase">
            {day === today ? "Today" : formatDay(items[0].startsAt, timeZone)}
          </h3>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {items.map((booking) => (
              <li key={booking.id}>
                <Link
                  href={routes.booking(booking.reference)}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/30"
                >
                  <span className="w-32 shrink-0 text-sm tabular-nums text-ink-muted">
                    {formatTimeRange(booking.startsAt, booking.endsAt, timeZone)}
                  </span>
                  <Avatar
                    name={booking.clientName}
                    src={booking.clientImage}
                    size={28}
                    className="hidden xs:inline-flex"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{booking.clientName}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {booking.serviceName} · {booking.location === "studio" ? "Studio" : "On location"}
                    </p>
                  </div>
                  <span className="hidden text-sm tabular-nums sm:inline">
                    {formatPrice(booking.priceCents)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
