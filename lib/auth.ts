import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";
import * as schema from "@/db/schema";
import { db } from "./db";
import { env } from "./env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  // Vercel preview deployments are served from their own URL.
  trustedOrigins: process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : [],
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      // Never accepted from client input: roles change only through
      // server-side flows (artist onboarding, demo provisioning).
      role: { type: "string", required: false, defaultValue: "client", input: false },
      demoWorkspaceId: { type: "string", required: false, input: false },
    },
  },
  session: {
    // Avoid a DB round-trip on every request; sessions are re-validated every 5 minutes.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Must be last so it can set cookies from server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"] & { role: "client" | "artist" };

/** Current session, deduplicated per request. */
export const getSession = cache(async () => {
  const requestHeaders = await headers();
  let session = await auth.api.getSession({ headers: requestHeaders });
  // Demo workspaces are deleted on a schedule, so a cached demo session may
  // point at a user that no longer exists. Re-check those against the DB.
  if ((session?.user as SessionUser | undefined)?.demoWorkspaceId) {
    session = await auth.api.getSession({
      headers: requestHeaders,
      query: { disableCookieCache: true },
    });
  }
  if (!session) return null;
  return { ...session, user: session.user as SessionUser };
});
