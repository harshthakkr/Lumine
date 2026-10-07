"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toQueryString } from "@/lib/search-params";
import { toLocalDate } from "@/lib/time";
import { CalendarIcon, ChevronIcon, SearchIcon } from "./icons";
import { Calendar } from "./ui/Calendar";

type Category = { slug: string; name: string };

/** Occasion + date search that drops visitors straight into filtered discovery. */
export function HeroSearch({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<string | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const today = toLocalDate(new Date(), "America/New_York");

  useEffect(() => {
    if (!calendarOpen) return;
    const close = (e: PointerEvent) => !dateRef.current?.contains(e.target as Node) && setCalendarOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setCalendarOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [calendarOpen]);

  const dateLabel = date
    ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
        new Date(`${date}T00:00:00Z`),
      )
    : "Any date";

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/artists${toQueryString({ category: category || undefined, date })}` as "/artists");
      }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-3xl bg-neutral-light p-2 text-left text-neutral-dark shadow-2xl shadow-neutral-dark/30 sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="relative flex flex-1 flex-col rounded-full px-5 py-2 transition-colors hover:bg-secondary/40">
        <span className="text-[11px] font-medium tracking-widest uppercase">Occasion</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm text-ink-muted outline-none"
        >
          <option value="">Any look</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronIcon className="pointer-events-none absolute right-5 bottom-3 size-3.5 text-ink-muted" />
      </label>
      <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
      <div ref={dateRef} className="relative flex-1">
        <button
          type="button"
          aria-expanded={calendarOpen}
          onClick={() => setCalendarOpen((o) => !o)}
          className="flex w-full flex-col rounded-full px-5 py-2 text-left transition-colors hover:bg-secondary/40"
        >
          <span className="text-[11px] font-medium tracking-widest uppercase">When</span>
          <span className="flex items-center gap-1.5 text-sm text-ink-muted">
            <CalendarIcon className="size-3.5" /> {dateLabel}
          </span>
        </button>
        {calendarOpen && (
          <div className="absolute bottom-full left-0 z-20 mb-3 animate-rise rounded-3xl border border-line bg-surface p-5 shadow-2xl sm:right-0 sm:left-auto">
            <Calendar
              value={date}
              min={today}
              onChange={(d) => {
                setDate(d === date ? undefined : d);
                setCalendarOpen(false);
              }}
            />
            {date && (
              <button
                type="button"
                onClick={() => {
                  setDate(undefined);
                  setCalendarOpen(false);
                }}
                className="mt-3 text-xs underline underline-offset-4"
              >
                Any date
              </button>
            )}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <SearchIcon className="size-4" />
        Find artists
      </button>
    </form>
  );
}
