"use client";

import { useState } from "react";
import { addDays, weekdayOf, type LocalDate } from "@/lib/time";
import { ChevronIcon } from "../icons";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function monthOf(date: LocalDate) {
  return date.slice(0, 7); // YYYY-MM
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Month grid date picker working purely in calendar dates (no timezones). */
export function Calendar({
  value,
  onChange,
  min,
  max,
}: {
  value?: LocalDate;
  onChange: (date: LocalDate) => void;
  min: LocalDate;
  max?: LocalDate;
}) {
  const [month, setMonth] = useState(monthOf(value ?? min));
  const first = `${month}-01` as LocalDate;
  const lead = weekdayOf(first);
  const days: (LocalDate | null)[] = Array.from({ length: lead }, () => null);
  for (let d = first; monthOf(d) === month; d = addDays(d, 1)) days.push(d);

  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${first}T00:00:00Z`),
  );
  const canPrev = month > monthOf(min);
  const canNext = !max || month < monthOf(max);

  return (
    <div className="w-[17rem]">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={!canPrev}
          aria-label="Previous month"
          className="grid size-8 place-items-center rounded-full hover:bg-secondary/60 disabled:opacity-30"
        >
          <ChevronIcon direction="left" />
        </button>
        <p className="text-sm font-medium" aria-live="polite">
          {label}
        </p>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canNext}
          aria-label="Next month"
          className="grid size-8 place-items-center rounded-full hover:bg-secondary/60 disabled:opacity-30"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-sm" role="grid" aria-label={label}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="pb-1 text-[11px] text-ink-muted">
            {d}
          </span>
        ))}
        {days.map((day, i) => {
          if (!day) return <span key={`blank-${i}`} />;
          const disabled = day < min || (max ? day > max : false);
          const selected = day === value;
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" }).format(
                new Date(`${day}T00:00:00Z`),
              )}
              onClick={() => onChange(day)}
              className={`mx-auto grid size-9 place-items-center rounded-full tabular-nums transition-colors ${
                selected
                  ? "bg-neutral-dark text-neutral-light"
                  : disabled
                    ? "text-neutral-dark/25"
                    : "hover:bg-secondary/70"
              } ${day === min && !selected ? "font-semibold" : ""}`}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
