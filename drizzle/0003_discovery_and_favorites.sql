CREATE TYPE "public"."cancellation_policy" AS ENUM('flexible', 'moderate', 'strict');--> statement-breakpoint
CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"artist_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_artist_id_pk" PRIMARY KEY("user_id","artist_id")
);
--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "borough" text;--> statement-breakpoint
-- Backfill from "Neighborhood, Borough" values written before this column existed.
UPDATE "artist_profiles"
  SET "borough" = trim(split_part("neighborhood", ',', 2)),
      "neighborhood" = trim(split_part("neighborhood", ',', 1))
  WHERE "neighborhood" LIKE '%,%';--> statement-breakpoint
UPDATE "artist_profiles" SET "borough" = "city" WHERE "borough" IS NULL OR "borough" = '';--> statement-breakpoint
ALTER TABLE "artist_profiles" ALTER COLUMN "borough" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "artist_profiles" ADD COLUMN "cancellation_policy" "cancellation_policy" DEFAULT 'moderate' NOT NULL;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_artist_id_artist_profiles_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artist_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favorites_artist_id_index" ON "favorites" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "artist_profiles_borough_index" ON "artist_profiles" USING btree ("borough");