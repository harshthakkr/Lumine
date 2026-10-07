"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { switchDemoRole } from "@/app/demo/actions";
import { GUIDE_COOKIE } from "@/lib/demo-constants";
import type { DemoGuide, GuideStepId } from "@/lib/demo-guide";
import { firstName } from "@/lib/format";
import { routes } from "@/lib/routes";
import { CheckIcon, ChevronIcon, XIcon } from "../icons";

type Step = {
  id: GuideStepId;
  title: string;
  body: string;
  /** Which side of the demo the step happens on. */
  side: "client" | "artist";
  cta: { label: string; href: ReturnType<typeof routes.artist> };
};

function SwitchButton({ label }: { label: string }) {
  const [, action, pending] = useActionState(switchDemoRole, null);
  return (
    <form action={action}>
      <button disabled={pending} className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-neutral-dark disabled:opacity-60">
        {pending ? "Switching…" : label}
      </button>
    </form>
  );
}

export function DemoGuidePanel({
  guide,
  role,
  workspaceId,
  initiallyOpen,
}: {
  guide: DemoGuide;
  role: "client" | "artist";
  workspaceId: string;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const client = firstName(guide.clientName);
  const artist = firstName(guide.artistName);

  const steps: Step[] = [
    {
      id: "save",
      side: "client",
      title: "Find an artist you love",
      body: `Browse as ${client}: filter by occasion or date and tap the heart to save someone.`,
      cta: { label: "Browse artists", href: routes.browse },
    },
    {
      id: "request",
      side: "client",
      title: `Request a booking with ${artist}`,
      body: `${artist} is you on the artist side. Pick a service and time on her profile and send a request.`,
      cta: { label: `Open ${artist}’s profile`, href: routes.artist(guide.artistSlug) },
    },
    {
      id: "accept",
      side: "artist",
      title: `Accept it as ${artist}`,
      body: `Switch sides. The request is waiting on ${artist}’s dashboard. Accept it and ${client}’s booking is confirmed.`,
      cta: { label: "Open the request", href: guide.bookingReference ? routes.booking(guide.bookingReference) : routes.dashboard },
    },
  ];
  const done = steps.filter((s) => guide.steps[s.id]).length;
  const current = steps.find((s) => !guide.steps[s.id]);

  const markSeen = () => {
    document.cookie = `${GUIDE_COOKIE}=${workspaceId}; path=/; max-age=86400; samesite=lax`;
  };

  useEffect(() => {
    if (!open) return;
    markSeen();
    const onPointer = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
    // markSeen only depends on workspaceId, which is fixed for this component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-light/20 px-3 py-1 font-medium transition-colors hover:border-primary"
      >
        <span className={done === steps.length ? "text-success" : "text-primary"}>
          {done === steps.length ? "✓" : `${done}/${steps.length}`}
        </span>
        Guide
        <ChevronIcon className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Demo guide"
          className="absolute top-full right-2 z-[70] mt-2 w-[min(24rem,calc(100vw-1rem))] animate-rise rounded-3xl bg-surface p-6 text-neutral-dark shadow-2xl shadow-neutral-dark/30 sm:right-8"
        >
          <div className="mb-1 flex items-start justify-between gap-4">
            <p className="font-playfair-display text-xl">
              {current ? "See the whole booking loop" : "You’ve seen the full loop"}
            </p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close guide" className="-mt-1 -mr-2 grid size-8 place-items-center rounded-full hover:bg-secondary/60">
              <XIcon />
            </button>
          </div>
          <p className="mb-5 text-sm text-ink-muted">
            {current
              ? `Three steps, about two minutes. You’re playing both ${client} (client) and ${artist} (artist).`
              : `${client} requested, ${artist} accepted, and the booking is confirmed on both sides.`}
          </p>
          <div className="mb-5 h-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-success transition-[width] duration-700" style={{ width: `${(done / steps.length) * 100}%` }} />
          </div>
          <ol className="flex flex-col gap-4">
            {steps.map((step, i) => {
              const isDone = guide.steps[step.id];
              const isCurrent = step === current;
              return (
                <li key={step.id} className={`flex gap-3 ${!isDone && !isCurrent ? "opacity-50" : ""}`}>
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                      isDone ? "bg-success text-white" : isCurrent ? "bg-neutral-dark text-neutral-light" : "border border-line"
                    }`}
                  >
                    {isDone ? <CheckIcon className="size-3.5" /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${isDone ? "text-ink-muted line-through decoration-1" : ""}`}>{step.title}</p>
                    {isCurrent && (
                      <>
                        <p className="mt-1 text-sm text-ink-muted">{step.body}</p>
                        <div className="mt-3">
                          {step.side === role && step.cta.href === pathname ? (
                            <p className="text-xs font-medium text-success">You’re on the right page. Go for it.</p>
                          ) : step.side === role ? (
                            <Link
                              href={step.cta.href}
                              onClick={() => setOpen(false)}
                              className="inline-block rounded-full bg-neutral-dark px-4 py-1.5 text-xs font-medium text-neutral-light"
                            >
                              {step.cta.label}
                            </Link>
                          ) : (
                            <SwitchButton label={`Switch to ${step.side === "artist" ? artist : client}`} />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {!current && guide.bookingReference && (
            <Link
              href={routes.booking(guide.bookingReference)}
              onClick={() => setOpen(false)}
              className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
            >
              View the confirmed booking
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
