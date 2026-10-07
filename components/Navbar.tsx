import { eq } from "drizzle-orm";
import { artistProfiles } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { DemoBar } from "./demo/DemoBar";
import { NavbarMenu, type NavUser } from "./NavbarMenu";

/** Sticky site header: the demo bar (when exploring) above role-aware navigation. */
export async function Navbar() {
  const session = await getSession();
  let user: NavUser | null = null;

  if (session) {
    const { name, email, image, role, demoWorkspaceId } = session.user;
    let profileSlug: string | null = null;
    if (role === "artist") {
      const [profile] = await db
        .select({ slug: artistProfiles.slug })
        .from(artistProfiles)
        .where(eq(artistProfiles.userId, session.user.id))
        .limit(1);
      profileSlug = profile?.slug ?? null;
    }
    user = { name, email, image: image ?? null, role, isDemo: !!demoWorkspaceId, profileSlug };
  }

  return (
    <header className="sticky top-0 z-50">
      {session?.user.demoWorkspaceId && (
        <DemoBar workspaceId={session.user.demoWorkspaceId} role={session.user.role} name={session.user.name} />
      )}
      <NavbarMenu user={user} />
    </header>
  );
}
