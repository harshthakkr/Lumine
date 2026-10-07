"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { Field } from "../ui/Field";
import { buttonStyles } from "../ui/button";
import { PasswordToggle } from "./PasswordToggle";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

type Errors = Partial<Record<keyof z.infer<typeof schema> | "form", string>>;

export function SignUpForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const flat = z.flattenError(parsed.error).fieldErrors;
      setErrors({ name: flat.name?.[0], email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }

    setErrors({});
    setPending(true);
    const { error } = await authClient.signUp.email(parsed.data);
    if (error) {
      setPending(false);
      if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
        setErrors({ email: "An account with this email already exists. Try signing in instead." });
      } else {
        setErrors({ form: error.message ?? "Something went wrong. Please try again." });
      }
      return;
    }
    router.push(routes.browse);
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
        label="Full name"
        name="name"
        autoComplete="name"
        placeholder="Your name"
        error={errors.name}
        disabled={pending}
      />
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
        autoComplete="new-password"
        error={errors.password}
        hint="At least 8 characters"
        disabled={pending}
        trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
      />
      <button type="submit" disabled={pending} className={buttonStyles({ size: "lg" })}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-neutral-dark underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
