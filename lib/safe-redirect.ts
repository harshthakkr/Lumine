import type { Route } from "next";

/** Only allow same-origin relative paths as post-auth destinations. */
export function safeNext(next: string | null | undefined, fallback: Route): Route {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next as Route;
}
