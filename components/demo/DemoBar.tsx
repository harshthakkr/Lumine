import { cookies } from "next/headers";
import { firstName } from "@/lib/format";
import { getDemoGuide } from "@/lib/demo-guide";
import { DemoBarActions } from "./DemoBarActions";
import { GUIDE_COOKIE } from "@/lib/demo-constants";
import { DemoGuidePanel } from "./DemoGuidePanel";

/** Strip shown while exploring a demo workspace: who you are, the guide, and controls. */
export async function DemoBar({
  workspaceId,
  role,
  name,
}: {
  workspaceId: string;
  role: "client" | "artist";
  name: string;
}) {
  const [guide, jar] = await Promise.all([getDemoGuide(workspaceId), cookies()]);
  // Open the guide automatically on a visitor's first page of a new demo.
  const initiallyOpen = jar.get(GUIDE_COOKIE)?.value !== workspaceId;

  return (
    <div className="relative bg-neutral-dark text-neutral-light">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs sm:px-8 sm:text-sm">
        <p className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-widest text-neutral-dark uppercase">
            Demo
          </span>
          <span className="truncate">
            <span className="hidden sm:inline">You&rsquo;re </span>
            <strong className="font-semibold">{firstName(name)}</strong>
            <span className="text-neutral-light/60"> · {role}</span>
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {guide && <DemoGuidePanel guide={guide} role={role} workspaceId={workspaceId} initiallyOpen={initiallyOpen} />}
          <DemoBarActions role={role} />
        </div>
      </div>
    </div>
  );
}
