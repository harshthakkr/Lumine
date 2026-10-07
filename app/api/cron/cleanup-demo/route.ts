import { deleteExpiredWorkspaces } from "@/lib/demo";

// Called daily by Vercel Cron (see vercel.json). Vercel sends
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let deleted = 0;
  for (let batch = await deleteExpiredWorkspaces(); batch > 0; batch = await deleteExpiredWorkspaces()) {
    deleted += batch;
  }
  return Response.json({ deleted });
}
