-- Guarantee at the database level that an artist can never hold two
-- overlapping active bookings, even under concurrent requests.
-- Keep the status list in sync with ACTIVE_BOOKING_STATUSES in db/schema/marketplace.ts.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "artist_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("status" IN ('awaiting_payment', 'requested', 'confirmed'));
