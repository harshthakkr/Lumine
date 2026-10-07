import { lt } from "drizzle-orm";
import { createDb } from "@/db/client";
import { demoWorkspaces } from "@/db/schema";

// Same job as /api/cron/cleanup-demo, for running by hand.
const { db, pool } = createDb(process.env.DATABASE_URL!, { max: 1 });
const deleted = await db
  .delete(demoWorkspaces)
  .where(lt(demoWorkspaces.expiresAt, new Date()))
  .returning({ id: demoWorkspaces.id });
console.log(`Deleted ${deleted.length} expired demo workspaces.`);
await pool.end();
