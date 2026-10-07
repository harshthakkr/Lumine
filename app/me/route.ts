import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { routes } from "@/lib/routes";

/** Sends a signed-in user to their home (artists → dashboard, clients → browse). */
export async function GET() {
  const session = await getSession();
  redirect(session ? routes.homeFor(session.user.role) : routes.signIn());
}
