"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { formatDuration, formatTime } from "@/lib/format";
import { getZonedParts } from "@/lib/time";
import { ChevronIcon } from "../icons";
import { useBooking } from "./BookingContext";

const PERIODS = [
  { label: "Morning", test: (h: number) => h < 12 },
  { label: "Afternoon", test: (h: number) => h >= 12 && h < 17 },
  { label: "Evening", test: (h: number) => h >= 17 },
];

function dayParts(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(d);
  return { weekday: f({ weekday: "short" }), day: f({ day: "numeric" }), month: f({ month: "short" }), full: f({ dateStyle: "full" }) };
}

// The viewer's timezone is only known in the browser.
const subscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function SlotPicker() {
  const { artist, service, availability, loading, shiftRange, canGoBack, selectedDate, setSelectedDate, slot, setSlot } =
    useBooking();
  const viewerZone = useSyncExternalStore(subscribe, browserZone, () => artist.timezone);
  const day = availability.days.find((d) => d.date === selectedDate);
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the selected day visible when the strip is wider than its container.
  useEffect(() => {
    const strip = stripRef.current;
    const button = strip?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!strip || !button) return;
    const target = button.offsetLeft - strip.clientWidth / 2 + button.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [selectedDate, availability.from]);
  const totalOpen = availability.days.reduce((n, d) => n + d.slots.length, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-neutral-dark">{service.name}</span> · {formatDuration(service.durationMinutes)}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shiftRange(-1)}
            disabled={!canGoBack || loading}
            aria-label="Earlier dates"
            className="grid size-9 place-items-center rounded-full border border-line hover:border-neutral-dark/40 disabled:opacity-30"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => shiftRange(1)}
            disabled={loading}
            aria-label="Later dates"
            className="grid size-9 place-items-center rounded-full border border-line hover:border-neutral-dark/40 disabled:opacity-30"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        role="radiogroup"
        aria-label="Date"
        className={`relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] transition-opacity sm:mx-0 sm:px-0 ${loading ? "opacity-50" : ""}`}
      >
        {availability.days.map((d) => {
          const p = dayParts(d.date);
          const open = d.slots.length > 0;
          const selected = d.date === selectedDate;
          return (
            <button
              key={d.date}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${p.full}, ${open ? `${d.slots.length} openings` : "fully booked"}`}
              disabled={!open}
              onClick={() => setSelectedDate(d.date)}
              className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border py-3 transition-colors ${
                selected
                  ? "border-neutral-dark bg-neutral-dark text-neutral-light"
                  : open
                    ? "border-line bg-surface hover:border-neutral-dark/40"
                    : "border-transparent bg-secondary/30 text-neutral-dark/30"
              }`}
            >
              <span className="text-[11px] tracking-wide uppercase opacity-70">{p.weekday}</span>
              <span className="my-0.5 font-playfair-display text-xl leading-none">{p.day}</span>
              <span className="text-[11px] opacity-70">{open ? `${d.slots.length} open` : "—"}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 min-h-40" aria-live="polite">
        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-xl bg-secondary/60" />
            ))}
          </div>
        ) : totalOpen === 0 ? (
          <div className="rounded-2xl bg-secondary/30 px-6 py-8 text-center">
            <p className="mb-1 font-medium">No openings in these two weeks</p>
            <p className="mb-4 text-sm text-ink-muted">{artist.name.split(" ")[0]} books up fast. Try the following weeks.</p>
            <button type="button" onClick={() => shiftRange(1)} className="text-sm font-medium underline underline-offset-4">
              Show later dates
            </button>
          </div>
        ) : day && day.slots.length ? (
          <div className="flex flex-col gap-5">
            {PERIODS.map((period) => {
              const slots = day.slots.filter((iso) => period.test(getZonedParts(new Date(iso), artist.timezone).hour));
              if (!slots.length) return null;
              return (
                <div key={period.label}>
                  <p className="mb-2 text-xs font-medium tracking-widest text-ink-muted uppercase">{period.label}</p>
                  <div role="radiogroup" aria-label={`${period.label} times`} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((iso) => {
                      const selected = iso === slot;
                      return (
                        <button
                          key={iso}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setSlot(selected ? null : iso)}
                          className={`h-11 rounded-xl border text-sm tabular-nums transition-[background-color,border-color,transform] duration-150 active:scale-95 ${
                            selected
                              ? "border-neutral-dark bg-neutral-dark text-neutral-light"
                              : "border-line bg-surface hover:border-neutral-dark/50"
                          }`}
                        >
                          {formatTime(new Date(iso), artist.timezone)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-ink-muted">Pick a day to see times.</p>
        )}
      </div>

      {viewerZone !== artist.timezone && (
        <p className="mt-4 text-xs text-ink-muted">Times are shown in New York time, where {artist.name.split(" ")[0]} works.</p>
      )}
    </div>
  );
}
