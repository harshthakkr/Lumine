import Image from "next/image";
import Link from "next/link";
import { formatPrice, pluralize } from "@/lib/format";
import { getOccasions } from "@/lib/queries/landing";
import { routes } from "@/lib/routes";
import { SectionHeader } from "./SectionHeader";

export async function Occasions() {
  const occasions = await getOccasions();
  return (
    <section id="occasions" className="mx-auto max-w-7xl scroll-mt-32 px-4 py-20 sm:px-8 sm:py-28">
      <SectionHeader
        eyebrow="Browse by occasion"
        title="What are you getting ready for?"
        link={{ href: routes.browse, label: "All artists" }}
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
        {occasions.map((o) => (
          <li key={o.slug}>
            <Link
              href={`${routes.browse}?category=${o.slug}` as typeof routes.browse}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-secondary sm:aspect-[5/4]"
            >
              <Image
                src={o.imageUrl}
                alt=""
                fill
                sizes="(min-width: 820px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark/75 via-neutral-dark/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-neutral-light sm:p-6">
                <h3 className="font-playfair-display text-xl sm:text-2xl">{o.name}</h3>
                <p className="mt-1 text-xs text-neutral-light/80 sm:text-sm">
                  {pluralize(o.artistCount, "artist")} · from {formatPrice(o.fromCents)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
