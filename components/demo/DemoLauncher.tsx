"use client";

import Image from "next/image";
import { useActionState } from "react";
import { startDemo, type DemoActionState } from "@/app/demo/actions";
import { RightArrowIcon } from "../icons/RightArrowIcon";

const PERSONAS = {
  client: {
    eyebrow: "As a client",
    title: "Book your next look",
    body: "Browse artists, check live availability, book an appointment and save favorites.",
    image: "/category-2.jpg",
    imageAlt: "Model wearing evening glam makeup",
    who: "You’ll be Maya, a regular client",
  },
  artist: {
    eyebrow: "As an artist",
    title: "Run your studio",
    body: "Answer requests, see your week at a glance, and track earnings and reviews.",
    image: "/artist-2.jpg",
    imageAlt: "Portrait of Selene Hartwell, makeup artist",
    who: "You’ll be Selene, an editorial artist",
  },
} as const;

function PersonaCard({ role }: { role: keyof typeof PERSONAS }) {
  const persona = PERSONAS[role];
  const [state, action, pending] = useActionState<DemoActionState, FormData>(startDemo, null);

  return (
    <form action={action} className="group">
      <input type="hidden" name="role" value={role} />
      <button
        disabled={pending}
        aria-busy={pending}
        className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 disabled:cursor-wait"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
          <Image
            src={persona.image}
            alt={persona.imageAlt}
            fill
            sizes="(min-width: 820px) 400px, 100vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
              role === "artist" ? "object-[50%_20%]" : ""
            }`}
          />
          <span className="absolute top-3 left-3 rounded-full bg-neutral-light/90 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur">
            {persona.eyebrow}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-6">
          <h3 className="font-playfair-display text-2xl">{persona.title}</h3>
          <p className="text-sm text-ink-muted">{persona.body}</p>
          <div className="mt-auto flex items-center justify-between pt-4 text-sm">
            <span className="text-ink-muted">{persona.who}</span>
            <span className="inline-flex items-center gap-1 font-medium text-neutral-dark">
              {pending ? (
                <>
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent"
                  />
                  Setting up…
                </>
              ) : (
                <>
                  Enter
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    <RightArrowIcon />
                  </span>
                </>
              )}
            </span>
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
        </div>
      </button>
    </form>
  );
}

export function DemoLauncher() {
  return (
    <section id="demo" className="mx-auto max-w-5xl scroll-mt-32 px-4 py-20 sm:px-8 sm:py-28">
      <div className="mb-10 text-center">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-accent uppercase">
          Live demo · no sign-up
        </p>
        <h2 className="mb-3 font-playfair-display text-3xl sm:text-4xl">Explore Luminé from both sides</h2>
        <p className="mx-auto max-w-xl text-ink-muted">
          You get a private sandbox with months of real bookings and reviews. A short guide walks you
          through booking as a client and accepting it as the artist. Nothing you do affects anyone
          else, and it resets after 24 hours.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <PersonaCard role="client" />
        <PersonaCard role="artist" />
      </div>
    </section>
  );
}
