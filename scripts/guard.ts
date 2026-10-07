/** Refuse destructive scripts against non-local databases unless --yes is passed. */
export function requireLocalOrConfirmed(databaseUrl: string | undefined, action: string) {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set (expected in .env.local)");
  const { hostname } = new URL(databaseUrl);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  if (!isLocal && !process.argv.includes("--yes")) {
    console.error(
      `Refusing to ${action} on remote database "${hostname}".\nRe-run with --yes if you really mean it, e.g. npm run db:seed -- --yes`,
    );
    process.exit(1);
  }
  return databaseUrl;
}
