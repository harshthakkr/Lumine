import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { routes } from "@/lib/routes";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Verified server-side (not just cookie presence) so a stale cookie can't cause a redirect loop.
  const session = await getSession();
  if (session) redirect(routes.homeFor(session.user.role));

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-secondary lg:block">
        <Image
          src="/category-1.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-dark/70 via-neutral-dark/10 to-transparent" />
        <Link
          href="/"
          className="absolute top-8 left-10 font-playfair-display text-xl tracking-widest text-neutral-light uppercase"
        >
          Luminé
        </Link>
        <blockquote className="absolute right-10 bottom-10 left-10 text-neutral-light">
          <p className="mb-4 font-playfair-display text-3xl leading-snug italic">
            &ldquo;Survived happy tears, a humid outdoor ceremony and hours of dancing. Still looked
            fresh in the last photos.&rdquo;
          </p>
          <footer className="text-sm text-neutral-light/80">
            A bride on her wedding with Priya Kapoor
          </footer>
        </blockquote>
      </aside>
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <Link
          href="/"
          className="mb-12 font-playfair-display text-xl tracking-widest uppercase lg:invisible"
        >
          Luminé
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
