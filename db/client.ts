import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Framework-agnostic database factory, shared by the app and by scripts
 * (seed, cleanup). App code should import `db` from "@/lib/db" instead.
 */
export function createDb(connectionString: string, options: { max?: number } = {}) {
  const pool = new Pool({ connectionString, max: options.max ?? 10 });
  const db = drizzle({ client: pool, schema, casing: "snake_case" });
  return { db, pool };
}

export type Database = ReturnType<typeof createDb>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
