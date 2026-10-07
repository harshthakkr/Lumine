"use client";

import { useEffect, useRef, useState } from "react";
import {
  BOROUGHS,
  countRefinements,
  PRICE_STEPS,
  RATING_STEPS,
  SORTS,
  type Borough,
  type SearchFilters,
  type Sort,
} from "@/lib/search-params";
import { addDays, toLocalDate, weekdayOf, type LocalDate } from "@/lib/time";
import { formatPrice } from "@/lib/format";
import { BoltIcon, CheckIcon, SearchIcon, SlidersIcon, StarIcon, XIcon } from "../icons";
import { Calendar } from "../ui/Calendar";
import { Popover } from "../ui/Popover";
import { buttonStyles } from "../ui/button";
import { useDiscovery } from "./DiscoveryProvider";

type Category = { slug: string; name: string };
type Refinements = Pick<SearchFilters, "area" | "maxPrice" | "minRating" | "date" | "instant" | "location">;

const TIMEZONE = "America/New_York";

// ---------------------------------------------------------------------------
// Filter groups, shared by desktop popovers and the mobile sheet

function OptionRow({
  selected,
  onClick,
  children,
  multi,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/50"
    >
      {children}
      <span
        className={`grid size-5 place-items-center border transition-colors ${multi ? "rounded-md" : "rounded-full"} ${
          selected ? "border-neutral-dark bg-neutral-dark text-neutral-light" : "border-line"
        }`}
      >
        {selected && <CheckIcon className="size-3.5" />}
      </span>
    </button>
  );
}

function AreaGroup({ value, onChange }: { value: Borough[]; onChange: (v: Borough[]) => void }) {
  return (
    <div role="group" aria-label="Area" className="-mx-3">
      {BOROUGHS.map((b) => (
        <OptionRow
          key={b}
          multi
          selected={value.includes(b)}
          onClick={() => onChange(value.includes(b) ? value.filter((v) => v !== b) : [...value, b])}
        >
          {b}
        </OptionRow>
      ))}
    </div>
  );
}

function PriceGroup({ value, onChange }: { value?: number; onChange: (v?: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Starting price" className="-mx-3">
      <OptionRow selected={!value} onClick={() => onChange(undefined)}>
        Any price
      </OptionRow>
      {PRICE_STEPS.map((p) => (
        <OptionRow key={p} selected={value === p} onClick={() => onChange(p)}>
          From {formatPrice(p * 100)} or less
        </OptionRow>
      ))}
    </div>
  );
}

function RatingGroup({ value, onChange }: { value?: number; onChange: (v?: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="-mx-3">
      <OptionRow selected={!value} onClick={() => onChange(undefined)}>
        Any rating
      </OptionRow>
      {RATING_STEPS.map((r) => (
        <OptionRow key={r} selected={value === r} onClick={() => onChange(r)}>
          <span className="inline-flex items-center gap-1.5">
            <StarIcon className="size-3.5 text-accent" />
            {r.toFixed(1)} and up
          </span>
        </OptionRow>
      ))}
    </div>
  );
}

function nextWeekday(from: LocalDate, weekday: number) {
  const diff = (weekday - weekdayOf(from) + 7) % 7;
  return addDays(from, diff);
}

function DateGroup({ value, onChange }: { value?: LocalDate; onChange: (v?: LocalDate) => void }) {
  const today = toLocalDate(new Date(), TIMEZONE);
  const quick = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "This Saturday", date: nextWeekday(addDays(today, 1), 6) },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            aria-pressed={value === q.date}
            onClick={() => onChange(value === q.date ? undefined : q.date)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              value === q.date ? "border-neutral-dark bg-neutral-dark text-neutral-light" : "border-line hover:border-neutral-dark/40"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
      <Calendar value={value} onChange={onChange} min={today} max={addDays(today, 90)} />
    </div>
  );
}

function MoreGroup({
  instant,
  location,
  onChange,
}: {
  instant: boolean;
  location?: "studio" | "client";
  onChange: (patch: Partial<Pick<SearchFilters, "instant" | "location">>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <label className="flex cursor-pointer items-start justify-between gap-6">
        <span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <BoltIcon className="size-3.5 text-primary" /> Instant book
          </span>
          <span className="text-xs text-ink-muted">Confirmed right away, no waiting for approval</span>
        </span>
        <input
          type="checkbox"
          checked={instant}
          onChange={(e) => onChange({ instant: e.target.checked })}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="relative mt-0.5 h-6 w-10 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-neutral-dark peer-focus-visible:outline-2 peer-focus-visible:outline-primary after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
        />
      </label>
      <div>
        <p className="mb-1 text-sm font-medium">Where</p>
        <div role="radiogroup" aria-label="Where" className="-mx-3">
          <OptionRow selected={!location} onClick={() => onChange({ location: undefined })}>
            Either
          </OptionRow>
          <OptionRow selected={location === "client"} onClick={() => onChange({ location: "client" })}>
            Comes to me
          </OptionRow>
          <OptionRow selected={location === "studio"} onClick={() => onChange({ location: "studio" })}>
            At the artist&rsquo;s studio
          </OptionRow>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function SearchBox() {
  const { filters, apply } = useDiscovery();
  const [text, setText] = useState(filters.q ?? "");
  const debounced = useDebounced(text.trim(), 350);
  const applied = useRef(filters.q ?? "");

  useEffect(() => {
    if (debounced === applied.current) return;
    applied.current = debounced;
    apply({ q: debounced || undefined });
    // `apply` changes identity every render; only the debounced text matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        applied.current = text.trim();
        apply({ q: text.trim() || undefined });
      }}
      className="relative flex-1"
    >
      <label htmlFor="artist-search" className="sr-only">
        Search artists
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted" />
      <input
        id="artist-search"
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Name, look or neighborhood"
        className="h-12 w-full rounded-full border border-line bg-surface pr-10 pl-11 text-sm outline-none transition-colors placeholder:text-ink-muted focus:border-neutral-dark/50"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            applied.current = "";
            apply({ q: undefined });
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-secondary/60"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </form>
  );
}

function CategoryPills({ categories }: { categories: Category[] }) {
  const { filters, apply } = useDiscovery();
  const items = [{ slug: undefined, name: "All looks" }, ...categories];
  return (
    <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <ul className="flex gap-2">
        {items.map((c) => {
          const active = filters.category === c.slug;
          return (
            <li key={c.slug ?? "all"}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => apply({ category: c.slug })}
                className={`h-9 rounded-full px-4 text-sm whitespace-nowrap transition-colors ${
                  active ? "bg-primary text-white" : "bg-secondary/50 hover:bg-secondary"
                }`}
              >
                {c.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function shortDate(date: LocalDate) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function ActiveChips() {
  const { filters, apply } = useDiscovery();
  const chips: { label: string; clear: () => void }[] = [];
  if (filters.q) chips.push({ label: `“${filters.q}”`, clear: () => apply({ q: undefined }) });
  if (filters.date) chips.push({ label: `Available ${shortDate(filters.date)}`, clear: () => apply({ date: undefined }) });
  for (const b of filters.area) chips.push({ label: b, clear: () => apply({ area: filters.area.filter((a) => a !== b) }) });
  if (filters.maxPrice) chips.push({ label: `Up to ${formatPrice(filters.maxPrice * 100)}`, clear: () => apply({ maxPrice: undefined }) });
  if (filters.minRating) chips.push({ label: `${filters.minRating.toFixed(1)}+ stars`, clear: () => apply({ minRating: undefined }) });
  if (filters.instant) chips.push({ label: "Instant book", clear: () => apply({ instant: false }) });
  if (filters.location) chips.push({ label: filters.location === "client" ? "Comes to me" : "At studio", clear: () => apply({ location: undefined }) });
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={chip.clear}
          aria-label={`Remove filter: ${chip.label}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 py-1 pr-2 pl-3 text-xs transition-colors hover:bg-secondary"
        >
          {chip.label}
          <XIcon className="size-3" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() =>
            apply({ q: undefined, date: undefined, area: [], maxPrice: undefined, minRating: undefined, instant: false, location: undefined })
          }
          className="text-xs font-medium underline underline-offset-4"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export function SortSelect() {
  const { filters, apply } = useDiscovery();
  return (
    <label className="relative inline-flex items-center gap-2 text-sm">
      <span className="text-ink-muted">Sort</span>
      <select
        value={filters.sort}
        onChange={(e) => apply({ sort: e.target.value as Sort })}
        className="h-10 cursor-pointer appearance-none rounded-full border border-line bg-surface pr-8 pl-4 outline-none hover:border-neutral-dark/40"
      >
        {Object.entries(SORTS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 text-xs">
        ▾
      </span>
    </label>
  );
}

function MobileFilters() {
  const { filters, apply } = useDiscovery();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Refinements>(filters);
  const count = countRefinements(filters);

  const open = () => {
    setDraft(filters);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const patch = (p: Partial<Refinements>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="relative inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm md:hidden"
      >
        <SlidersIcon className="size-4" />
        Filters
        {count > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-neutral-dark text-[11px] text-neutral-light">
            {count}
          </span>
        )}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-3xl bg-neutral-light p-0 backdrop:bg-neutral-dark/40 open:animate-rise"
        aria-label="Filters"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-neutral-light px-5 py-4">
          <button type="button" onClick={close} aria-label="Close filters" className="grid size-8 place-items-center rounded-full hover:bg-secondary/60">
            <XIcon />
          </button>
          <p className="font-medium">Filters</p>
          <button
            type="button"
            onClick={() => setDraft({ area: [], maxPrice: undefined, minRating: undefined, date: undefined, instant: false, location: undefined })}
            className="text-sm underline underline-offset-4"
          >
            Reset
          </button>
        </div>
        <div className="flex flex-col divide-y divide-line px-5">
          <section className="py-5">
            <h3 className="mb-3 font-playfair-display text-lg">Date</h3>
            <DateGroup value={draft.date} onChange={(date) => patch({ date })} />
          </section>
          <section className="py-5">
            <h3 className="mb-2 font-playfair-display text-lg">Area</h3>
            <AreaGroup value={draft.area} onChange={(area) => patch({ area })} />
          </section>
          <section className="py-5">
            <h3 className="mb-2 font-playfair-display text-lg">Price</h3>
            <PriceGroup value={draft.maxPrice} onChange={(maxPrice) => patch({ maxPrice })} />
          </section>
          <section className="py-5">
            <h3 className="mb-2 font-playfair-display text-lg">Rating</h3>
            <RatingGroup value={draft.minRating} onChange={(minRating) => patch({ minRating })} />
          </section>
          <section className="py-5">
            <MoreGroup instant={draft.instant} location={draft.location} onChange={patch} />
          </section>
        </div>
        <div className="sticky bottom-0 border-t border-line bg-neutral-light p-4">
          <button
            type="button"
            onClick={() => {
              apply(draft);
              close();
            }}
            className={buttonStyles({ size: "lg", className: "w-full" })}
          >
            Show artists
          </button>
        </div>
      </dialog>
    </>
  );
}

export function FilterBar({ categories }: { categories: Category[] }) {
  const { filters, apply } = useDiscovery();
  const areaLabel =
    filters.area.length === 0 ? "Area" : filters.area.length === 1 ? filters.area[0] : `${filters.area.length} areas`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <SearchBox />
        <MobileFilters />
      </div>
      <CategoryPills categories={categories} />
      <div className="hidden items-center justify-between gap-4 md:flex">
        <div className="flex flex-wrap items-center gap-2">
          <Popover label={filters.date ? shortDate(filters.date) : "Date"} active={!!filters.date}>
            {(close) => (
              <DateGroup
                value={filters.date}
                onChange={(date) => {
                  apply({ date });
                  close();
                }}
              />
            )}
          </Popover>
          <Popover label={areaLabel} active={filters.area.length > 0}>
            {() => <AreaGroup value={filters.area} onChange={(area) => apply({ area })} />}
          </Popover>
          <Popover
            label={filters.maxPrice ? `Up to ${formatPrice(filters.maxPrice * 100)}` : "Price"}
            active={!!filters.maxPrice}
          >
            {(close) => (
              <PriceGroup
                value={filters.maxPrice}
                onChange={(maxPrice) => {
                  apply({ maxPrice });
                  close();
                }}
              />
            )}
          </Popover>
          <Popover label={filters.minRating ? `${filters.minRating.toFixed(1)}+` : "Rating"} active={!!filters.minRating}>
            {(close) => (
              <RatingGroup
                value={filters.minRating}
                onChange={(minRating) => {
                  apply({ minRating });
                  close();
                }}
              />
            )}
          </Popover>
          <Popover
            label="More"
            active={filters.instant || !!filters.location}
          >
            {() => <MoreGroup instant={filters.instant} location={filters.location} onChange={apply} />}
          </Popover>
        </div>
        <SortSelect />
      </div>
      <ActiveChips />
    </div>
  );
}
