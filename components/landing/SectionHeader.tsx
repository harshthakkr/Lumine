import Link from "next/link";
import type { Route } from "next";
import { ArrowIcon } from "../icons";

export function SectionHeader({
  eyebrow,
  title,
  description,
  link,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  link?: { href: Route; label: string };
  align?: "left" | "center";
}) {
  return (
    <div
      className={`mb-10 flex flex-col gap-4 ${
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className={align === "center" ? "max-w-2xl" : "max-w-xl"}>
        {eyebrow && <p className="mb-3 text-xs font-medium tracking-[0.2em] text-accent uppercase">{eyebrow}</p>}
        <h2 className="font-playfair-display text-3xl sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-ink-muted">{description}</p>}
      </div>
      {link && (
        <Link href={link.href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
          {link.label}
          <ArrowIcon className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
