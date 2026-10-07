import { Client } from "pg";
import { requireLocalOrConfirmed } from "./guard";

// Drops every table so migrations can rebuild the schema from scratch.
const url = requireLocalOrConfirmed(process.env.DATABASE_URL, "drop all tables");
const client = new Client({ connectionString: url });

await client.connect();
await client.query("drop schema if exists drizzle cascade");
await client.query("drop schema public cascade");
await client.query("create schema public");
await client.end();
console.log("Database reset. Run migrations next.");
