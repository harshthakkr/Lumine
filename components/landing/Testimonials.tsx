import Image from "next/image";
import Link from "next/link";
import { getFeaturedReviews } from "@/lib/queries/landing";
import { routes } from "@/lib/routes";
import { StarRating } from "../ui/StarRating";
import { SectionHeader } from "./SectionHeader";

export async function Testimonials() {
  const reviews = await getFeaturedReviews();
  if (!reviews.length) return null;

  return (
    <section className="bg-secondary/25">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
        <SectionHeader eyebrow="Verified reviews" title="From people who’ve booked" align="center" />
        <ul className="grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col rounded-3xl bg-surface p-8">
              <StarRating rating={5} className="mb-5" />
              <blockquote className="flex-1 font-playfair-display text-lg leading-relaxed">&ldquo;{r.body}&rdquo;</blockquote>
              <div className="mt-8 flex items-center gap-3 border-t border-line pt-5">
                <Image src={r.artistAvatar} alt="" width={40} height={40} sizes="80px" className="size-10 rounded-full object-cover object-top" />
                <p className="text-sm">
                  <span className="font-medium">{r.authorName}</span>
                  <span className="block text-ink-muted">
                    {r.serviceName} with{" "}
                    <Link href={routes.artist(r.artistSlug)} className="underline-offset-4 hover:underline">
                      {r.artistName}
                    </Link>
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
