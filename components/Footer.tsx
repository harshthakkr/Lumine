import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";

const COLUMNS: { title: string; links: { href: Route | string; label: string; external?: boolean }[] }[] = [
  {
    title: "Explore",
    links: [
      { href: routes.browse, label: "Browse artists" },
      { href: "/#occasions", label: "Occasions" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
  {
    title: "For artists",
    links: [
      { href: "/#for-artists", label: "Why Luminé" },
      { href: "/#demo", label: "Try the artist dashboard" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "https://github.com/harshthakkr/Lumine", label: "Source on GitHub", external: true },
      { href: "/#demo", label: "Explore the demo" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-line bg-neutral-light">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-8 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Link href={routes.home} className="font-playfair-display text-2xl tracking-widest uppercase">
            Luminé
          </Link>
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Book trusted makeup artists in New York for every occasion. A portfolio project built with Next.js and Postgres.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-xs font-medium tracking-widest text-ink-muted uppercase">{col.title}</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                      {l.label} ↗
                    </a>
                  ) : (
                    <Link href={l.href as Route} className="hover:text-accent">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-ink-muted sm:px-8">
          Artists, clients and bookings are fictional demo data. Portfolio photography from Unsplash.
        </p>
      </div>
    </footer>
  );
};
