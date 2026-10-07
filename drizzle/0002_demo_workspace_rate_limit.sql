ALTER TABLE "demo_workspaces" ADD COLUMN "ip_hash" text;--> statement-breakpoint
CREATE INDEX "demo_workspaces_ip_hash_created_at_index" ON "demo_workspaces" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "demo_workspaces_expires_at_index" ON "demo_workspaces" USING btree ("expires_at");