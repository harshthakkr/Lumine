"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { exitDemo } from "@/app/demo/actions";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { ChevronIcon } from "./icons";
import { CloseIcon } from "./icons/CloseIcon";
import { HamburgerIcon } from "./icons/HamburgerIcon";
import { Avatar } from "./ui/Avatar";
import { buttonStyles } from "./ui/button";

export type NavUser = {
  name: string;
  email: string;
  image: string | null;
  role: "client" | "artist";
  isDemo: boolean;
  profileSlug: string | null;
};

type NavLink = { href: Route; label: string; match?: (path: string) => boolean };

function linksFor(user: NavUser | null): NavLink[] {
  if (!user) {
    return [
      { href: routes.browse, label: "Browse artists", match: (p) => p.startsWith("/artists") },
      { href: "/#how-it-works" as Route, label: "How it works" },
      { href: "/#for-artists" as Route, label: "For artists" },
    ];
  }
  if (user.role === "artist") {
    return [
      { href: routes.dashboard, label: "Dashboard", match: (p) => p.startsWith("/dashboard") },
      { href: routes.bookings, label: "Bookings", match: (p) => p.startsWith("/bookings") },
      ...(user.profileSlug
        ? [{ href: routes.artist(user.profileSlug), label: "My profile", match: (p: string) => p === `/artists/${user.profileSlug}` }]
        : []),
    ];
  }
  return [
    { href: routes.browse, label: "Browse", match: (p) => p.startsWith("/artists") || p.startsWith("/book/") },
    { href: routes.bookings, label: "Bookings", match: (p) => p.startsWith("/bookings") },
    { href: routes.saved, label: "Saved", match: (p) => p === "/saved" },
  ];
}

function useSignOut(user: NavUser | null) {
  const router = useRouter();
  const [, exitAction, exiting] = useActionState(exitDemo, undefined);
  const signOut = async () => {
    await authClient.signOut();
    router.push(routes.home);
    router.refresh();
  };
  return { signOut, exitAction, exiting, isDemo: !!user?.isDemo };
}

function AccountMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { signOut, exitAction, exiting, isDemo } = useSignOut(user);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary/50";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-line py-1 pr-3 pl-1 transition-colors hover:border-neutral-dark/30"
      >
        <Avatar name={user.name} src={user.image} size={30} />
        <ChevronIcon className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-64 animate-rise rounded-2xl border border-line bg-surface p-2 shadow-xl shadow-neutral-dark/10">
          <div className="border-b border-line px-3 pt-2 pb-3">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">
              {user.isDemo ? `Demo ${user.role}` : user.email}
            </p>
          </div>
          <div className="py-1" onClick={() => setOpen(false)}>
            {linksFor(user).map((l) => (
              <Link key={l.href} href={l.href} className={item}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-line pt-1">
            {isDemo ? (
              <form action={exitAction}>
                <button disabled={exiting} className={`${item} text-danger`}>
                  {exiting ? "Exiting…" : "Exit demo"}
                </button>
              </form>
            ) : (
              <button type="button" onClick={signOut} className={item}>
                Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NavbarMenu({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = linksFor(user);
  const { signOut, exitAction, exiting, isDemo } = useSignOut(user);
  const logoHref = user ? routes.homeFor(user.role) : routes.home;

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  return (
    <div className="relative border-b border-line bg-neutral-light/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-8" aria-label="Main">
        <Link href={logoHref} className="font-playfair-display text-xl tracking-widest uppercase">
          Luminé
        </Link>

        <ul className="hidden items-center gap-1 text-sm md:flex">
          {links.map((link) => {
            const active = link.match?.(pathname) ?? false;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-4 py-2 transition-colors ${
                    active ? "bg-secondary/70 font-medium" : "text-neutral-dark/80 hover:bg-secondary/40 hover:text-neutral-dark"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <Link href={routes.signIn()} className={buttonStyles({ variant: "ghost", size: "sm" })}>
                Sign in
              </Link>
              <Link href={"/#demo" as Route} className={buttonStyles({ size: "sm" })}>
                Try the demo
              </Link>
            </>
          )}
        </div>

        <button
          className="grid size-10 place-items-center md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </nav>

      {mobileOpen && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-line bg-neutral-light px-4 pb-6 shadow-lg md:hidden">
          {user && (
            <div className="flex items-center gap-3 border-b border-line py-4">
              <Avatar name={user.name} src={user.image} size={36} />
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-ink-muted">{user.isDemo ? `Demo ${user.role}` : user.email}</p>
              </div>
            </div>
          )}
          <ul className="flex flex-col py-2 text-base">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={link.match?.(pathname) ? "page" : undefined}
                  className="block rounded-lg px-2 py-3 hover:bg-secondary/50 aria-[current=page]:font-medium"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex gap-3 pt-2">
            {user ? (
              isDemo ? (
                <form action={exitAction} className="flex-1">
                  <button disabled={exiting} className={buttonStyles({ variant: "secondary", className: "w-full" })}>
                    {exiting ? "Exiting…" : "Exit demo"}
                  </button>
                </form>
              ) : (
                <button onClick={signOut} className={buttonStyles({ variant: "secondary", className: "flex-1" })}>
                  Sign out
                </button>
              )
            ) : (
              <>
                <Link href={routes.signIn()} className={buttonStyles({ variant: "secondary", className: "flex-1" })}>
                  Sign in
                </Link>
                <Link href={"/#demo" as Route} onClick={() => setMobileOpen(false)} className={buttonStyles({ className: "flex-1" })}>
                  Try the demo
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
