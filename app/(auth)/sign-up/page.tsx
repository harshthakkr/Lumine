import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-2 font-playfair-display text-4xl">Create your account</h1>
      <p className="mb-10 text-ink-muted">Book artists in a few taps and keep every appointment in one place.</p>
      <SignUpForm />
      <p className="mt-10 rounded-xl border border-dashed border-line px-4 py-3 text-center text-sm text-ink-muted">
        Are you a makeup artist? Artist accounts open soon.{" "}
        <Link href="/#for-artists" className="font-medium text-neutral-dark underline-offset-4 hover:underline">
          Preview the artist dashboard
        </Link>
      </p>
    </>
  );
}
