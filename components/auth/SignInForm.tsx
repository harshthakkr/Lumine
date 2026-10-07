"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-redirect";
import { Field } from "../ui/Field";
import { buttonStyles } from "../ui/button";
import { PasswordToggle } from "./PasswordToggle";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type Errors = Partial<Record<keyof z.infer<typeof schema> | "form", string>>;

export function SignInForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }

    setErrors({});
    setPending(true);
    const { error } = await authClient.signIn.email(parsed.data);
    if (error) {
      setPending(false);
      setErrors({
        form:
          error.status === 401
            ? "That email and password don’t match. Check for typos and try again."
            : (error.message ?? "Something went wrong. Please try again."),
      });
      return;
    }
    // /me routes artists to their dashboard and clients to browse.
    router.push(safeNext(next, "/me" as Route));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      {errors.form && (
        <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {errors.form}
        </p>
      )}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email}
        disabled={pending}
      />
      <Field
        label="Password"
        name="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        error={errors.password}
        disabled={pending}
        trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
      />
      <button type="submit" disabled={pending} className={buttonStyles({ size: "lg" })}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        New to Luminé?{" "}
        <Link href="/sign-up" className="font-medium text-neutral-dark underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
