import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { createDb } from "@/db/client";
import { env } from "./env";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { lumineDb?: ReturnType<typeof createDb> };

const instance = globalForDb.lumineDb ?? createDb(env.DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForDb.lumineDb = instance;

// On Vercel Fluid compute, release idle connections before the function suspends.
attachDatabasePool(instance.pool);

export const db = instance.db;
