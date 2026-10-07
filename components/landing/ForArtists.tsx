import { BoltIcon, CalendarIcon, CheckIcon, StarIcon } from "../icons";
import { StartDemoButton } from "../demo/StartDemoButton";

const POINTS = [
  { icon: <CalendarIcon className="size-4" />, text: "Clients only see times you’re actually free. No back-and-forth DMs." },
  { icon: <BoltIcon className="size-4" />, text: "Accept requests in one tap, or turn on instant booking." },
  { icon: <StarIcon className="size-4" />, text: "Every review comes from a real booking, so your rating means something." },
];

export function ForArtists() {
  return (
    <section id="for-artists" className="scroll-mt-32 bg-neutral-dark text-neutral-light">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-primary uppercase">For makeup artists</p>
          <h2 className="mb-5 font-playfair-display text-3xl sm:text-4xl">
            Your calendar, clients and reviews in one place
          </h2>
          <ul className="mb-10 flex flex-col gap-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex gap-3 text-neutral-light/85">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-neutral-light/10 text-primary">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
          <StartDemoButton
            role="artist"
            className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-neutral-dark transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            Explore the artist dashboard
          </StartDemoButton>
          <p className="mt-3 text-xs text-neutral-light/60">Artist sign-ups open soon. The dashboard is fully usable in the demo today.</p>
        </div>

        {/* Static preview of the dashboard's request card. */}
        <div aria-hidden className="relative mx-auto w-full max-w-md">
          <div className="rounded-3xl bg-neutral-light p-6 text-neutral-dark shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-secondary text-sm font-medium">NM</span>
                <div>
                  <p className="font-medium">Naomi M.</p>
                  <p className="text-xs text-ink-muted">Requested 2 hours ago</p>
                </div>
              </div>
              <p className="font-playfair-display text-xl">$190</p>
            </div>
            <p className="text-sm font-medium">Full Evening Glam</p>
            <p className="text-sm text-ink-muted">Fri, Oct 16 · 5:00 – 6:15 PM · At your studio</p>
            <p className="mt-4 rounded-xl bg-secondary/40 px-4 py-3 text-sm">&ldquo;Black-tie gala, I&rsquo;d love a bold lip.&rdquo;</p>
            <div className="mt-5 flex gap-2">
              <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-4 text-xs font-medium text-white">
                <CheckIcon className="size-3.5" /> Accept
              </span>
              <span className="inline-flex h-8 items-center rounded-lg border border-line px-4 text-xs text-danger">Decline</span>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-8 z-10 rotate-3 rounded-2xl bg-primary px-5 py-4 text-neutral-dark shadow-xl sm:-right-8">
            <p className="text-[11px] font-medium tracking-widest uppercase opacity-70">Earned · 30 days</p>
            <p className="font-playfair-display text-3xl">$4,110</p>
          </div>
        </div>
      </div>
    </section>
  );
}
