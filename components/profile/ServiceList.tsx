"use client";

import { formatDuration, formatPrice } from "@/lib/format";
import { CheckIcon, ClockIcon } from "../icons";
import { useBooking } from "./BookingContext";

export function ServiceList() {
  const { services, service, selectService } = useBooking();

  return (
    <div role="radiogroup" aria-label="Choose a service" className="grid gap-3">
      {services.map((s) => {
        const selected = s.id === service.id;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              selectService(s.id);
              document.getElementById("availability")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={`group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-[border-color,background-color,box-shadow] duration-200 ${
              selected
                ? "border-neutral-dark bg-surface shadow-[0_0_0_1px_var(--color-neutral-dark)]"
                : "border-line bg-surface hover:border-neutral-dark/40"
            }`}
          >
            <span
              aria-hidden
              className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
                selected ? "border-neutral-dark bg-neutral-dark text-neutral-light" : "border-line"
              }`}
            >
              {selected && <CheckIcon className="size-3" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-medium">{s.name}</span>
                <span className="font-playfair-display text-lg">{formatPrice(s.priceCents)}</span>
              </span>
              <span className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="size-3.5" />
                  {formatDuration(s.durationMinutes)}
                </span>
                <span>{s.categoryName}</span>
              </span>
              <span className="mt-2 block text-sm text-neutral-dark/75">{s.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
