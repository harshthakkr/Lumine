"use server";

import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, getSession } from "@/lib/auth";
import { routes } from "@/lib/routes";
import {
  deleteExpiredWorkspaces,
  deleteWorkspace,
  demoPassword,
  getWorkspaceCounterpart,
  hashIp,
  isDemoRateLimited,
  provisionDemoWorkspace,
  type DemoRole,
} from "@/lib/demo";

export type DemoActionState = { error: string } | null;

// Clients start where a client's story starts: browsing artists.
const HOME: Record<DemoRole, Route> = {
  client: routes.browse,
  artist: routes.dashboard,
};

async function signInAs(user: { id: string; email: string }) {
  const requestHeaders = await headers();
  await auth.api.signInEmail({
    body: { email: user.email, password: demoPassword(user.id) },
    headers: requestHeaders,
  });
}

async function signOutCurrent() {
  await auth.api.signOut({ headers: await headers() }).catch(() => {
    // Already signed out (e.g. the session expired); nothing to revoke.
  });
}

/** Postgres exclusion_violation: two demos raced for the same artist slot. */
function isSlotRace(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23P01") return true;
  return "cause" in error && isSlotRace(error.cause);
}

/** Form action: works before hydration because it's passed to <form> directly. */
export async function startDemo(_prev: DemoActionState, formData: FormData): Promise<DemoActionState> {
  const role: DemoRole = formData.get("role") === "artist" ? "artist" : "client";
  const session = await getSession();

  // Already exploring: just hop to the requested side.
  if (session?.user.demoWorkspaceId) {
    if (session.user.role !== role) {
      const counterpart = await getWorkspaceCounterpart(session.user.demoWorkspaceId, role);
      if (counterpart) {
        await signOutCurrent();
        await signInAs(counterpart);
      }
    }
    redirect(HOME[role]);
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const ipHash = hashIp(ip);
  if (await isDemoRateLimited(ipHash)) {
    return { error: "You've started a lot of demos recently. Please try again in an hour." };
  }

  // Opportunistic cleanup so expired demos never pile up, even without cron.
  await deleteExpiredWorkspaces(20);

  let workspace;
  try {
    workspace = await provisionDemoWorkspace(ipHash);
  } catch (error) {
    if (!isSlotRace(error)) throw error;
    workspace = await provisionDemoWorkspace(ipHash);
  }

  if (session) await signOutCurrent();
  await signInAs(role === "client" ? workspace.client : workspace.artist);
  redirect(HOME[role]);
}

export async function switchDemoRole(): Promise<DemoActionState> {
  const session = await getSession();
  const workspaceId = session?.user.demoWorkspaceId;
  if (!session || !workspaceId) return { error: "Your demo session has ended." };

  const target: DemoRole = session.user.role === "artist" ? "client" : "artist";
  const counterpart = await getWorkspaceCounterpart(workspaceId, target);
  if (!counterpart) return { error: "Your demo session has ended." };

  await signOutCurrent();
  await signInAs(counterpart);
  redirect(HOME[target]);
}

export async function exitDemo() {
  const session = await getSession();
  await signOutCurrent();
  if (session?.user.demoWorkspaceId) await deleteWorkspace(session.user.demoWorkspaceId);
  redirect("/");
}
