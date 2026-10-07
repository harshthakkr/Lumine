import { CalendarIcon, SearchIcon, StarIcon } from "../icons";
import { SectionHeader } from "./SectionHeader";

const STEPS = [
  {
    icon: <SearchIcon className="size-5" />,
    title: "Find your artist",
    body: "Filter by occasion, date, neighborhood and budget. Every profile shows a real portfolio, verified reviews and prices up front.",
  },
  {
    icon: <CalendarIcon className="size-5" />,
    title: "Pick a time that’s actually free",
    body: "Availability comes straight from the artist’s calendar. Instant-book artists confirm on the spot; others reply within 24 hours.",
  },
  {
    icon: <StarIcon className="size-5" />,
    title: "Show up camera-ready",
    body: "Visit their studio or have them come to you. Your booking, notes and calendar invite all live in one place.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-20 sm:px-8 sm:py-28">
      <SectionHeader eyebrow="How it works" title="Booked in three steps" align="center" />
      <ol className="grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative rounded-3xl border border-line bg-surface p-8">
            <span className="absolute top-6 right-7 font-playfair-display text-5xl text-secondary">{i + 1}</span>
            <span className="mb-6 grid size-11 place-items-center rounded-full bg-secondary/60 text-primary">{step.icon}</span>
            <h3 className="mb-2 font-playfair-display text-xl">{step.title}</h3>
            <p className="text-sm leading-relaxed text-ink-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
