import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <h1 className="mb-2 font-playfair-display text-4xl">Welcome back</h1>
      <p className="mb-10 text-ink-muted">Sign in to manage your bookings.</p>
      <Suspense>
        <SignInForm />
      </Suspense>
      <DemoHint />
    </>
  );
}

function DemoHint() {
  return (
    <p className="mt-10 rounded-xl border border-dashed border-line px-4 py-3 text-center text-sm text-ink-muted">
      Just looking around?{" "}
      <Link href="/#demo" className="font-medium text-neutral-dark underline-offset-4 hover:underline">
        Explore the demo
      </Link>{" "}
      without signing up.
    </p>
  );
}
