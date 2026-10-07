import Link from "next/link";
import type { bookingStatus } from "@/db/schema";
import { formatPrice, formatTimeRange } from "@/lib/format";
import { routes } from "@/lib/routes";
import { Avatar } from "../ui/Avatar";
import { StatusPill } from "../ui/StatusPill";
import { DateBadge } from "./DateBadge";

export type BookingRowData = {
  reference: string;
  status: (typeof bookingStatus.enumValues)[number];
  startsAt: Date;
  endsAt: Date;
  serviceName: string;
  priceCents: number;
  reviewRating?: number | null;
};

/** One booking in a list, from the point of view of whoever is looking. */
export function BookingRow({
  booking,
  timeZone,
  counterpart,
  place,
  viewer = "client",
}: {
  booking: BookingRowData;
  timeZone: string;
  /** The other party: the artist for clients, the client for artists. */
  counterpart: { name: string; image?: string | null };
  place: string;
  viewer?: "client" | "artist";
}) {
  const muted = ["cancelled", "declined", "expired"].includes(booking.status);
  return (
    <li>
      <Link
        href={routes.booking(booking.reference)}
        className="-mx-3 flex items-center gap-4 rounded-2xl px-3 py-4 transition-colors hover:bg-secondary/30"
      >
        <DateBadge date={booking.startsAt} timeZone={timeZone} />
        <div className={`min-w-0 flex-1 ${muted ? "opacity-60" : ""}`}>
          <p className="truncate font-medium">{booking.serviceName}</p>
          <p className="flex items-center gap-1.5 truncate text-sm text-ink-muted">
            <Avatar name={counterpart.name} src={counterpart.image} size={18} />
            <span className="truncate">
              {counterpart.name} · {formatTimeRange(booking.startsAt, booking.endsAt, timeZone)}
            </span>
          </p>
          <p className="truncate text-xs text-ink-muted">{place}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
          <StatusPill status={booking.status} viewer={viewer} />
          <span className="text-xs text-ink-muted">
            {booking.status === "completed"
              ? booking.reviewRating
                ? `Rated ${"★".repeat(booking.reviewRating)}`
                : "Not reviewed yet"
              : formatPrice(booking.priceCents)}
          </span>
        </div>
      </Link>
    </li>
  );
}

export function BookingSection({
  title,
  count,
  children,
  empty,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  empty?: string;
}) {
  const hasItems = count === undefined || count > 0;
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-medium tracking-widest text-ink-muted uppercase">
        {title}
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-neutral-dark">{count}</span>
        )}
      </h2>
      {hasItems ? (
        <ul className="divide-y divide-line">{children}</ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line px-6 py-6 text-center text-sm text-ink-muted">{empty}</p>
      )}
    </section>
  );
}
