import { getSession } from "@/lib/auth";
import { buildIcs } from "@/lib/ics";
import { getBookingForViewer } from "@/lib/queries/bookings";
import { routes } from "@/lib/routes";

export async function GET(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Not found", { status: 404 });
  const { reference } = await params;
  const row = await getBookingForViewer(reference, session.user.id);
  if (!row || !["confirmed", "requested"].includes(row.booking.status)) {
    return new Response("Not found", { status: 404 });
  }
  const { booking, artist } = row;
  const origin = new URL(request.url).origin;
  const location =
    booking.location === "studio"
      ? `${artist.name}'s studio, ${artist.neighborhood}, ${artist.borough}`
      : (booking.address ?? "");

  const body = buildIcs({
    uid: `${booking.id}@lumine`,
    start: booking.startsAt,
    end: booking.endsAt,
    title: `${booking.serviceName} with ${artist.name}`,
    description: `Luminé booking ${booking.reference}${booking.status === "requested" ? " (awaiting confirmation)" : ""}`,
    location,
    url: `${origin}${routes.booking(booking.reference)}`,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="lumine-${booking.reference}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
