import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
};

/** Labelled input in Luminé's underlined style, with an animated error slot. */
export function Field({ label, error, hint, trailing, className = "", ...input }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-xs tracking-wide text-accent uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={`w-full border-b bg-transparent pb-1.5 text-base text-neutral-dark outline-none transition-colors duration-300 placeholder:text-neutral-dark/30 focus:border-primary disabled:cursor-not-allowed ${
            error ? "border-danger" : "border-neutral-dark/70"
          } ${trailing ? "pr-14" : ""}`}
          {...input}
        />
        {trailing && <div className="absolute top-0 right-0">{trailing}</div>}
      </div>
      <div
        id={messageId}
        className={`grid transition-all duration-300 ease-in-out ${
          error || hint ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <span className={`overflow-hidden text-xs ${error ? "text-danger" : "text-ink-muted"}`}>
          {error ?? hint}
        </span>
      </div>
    </div>
  );
}
