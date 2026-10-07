"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronIcon } from "../icons";

/**
 * Pill-shaped trigger with a dropdown panel. Closes on outside click and
 * Escape, and returns focus to the trigger.
 */
export function Popover({
  label,
  active,
  align = "start",
  children,
}: {
  label: React.ReactNode;
  active?: boolean;
  align?: "start" | "end";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const root = rootRef.current;
    // Tracked live because by cleanup time the panel has left the DOM.
    let focusInside = !!root?.contains(document.activeElement);
    const onFocusIn = (e: FocusEvent) => {
      focusInside = !!root?.contains(e.target as Node);
    };
    const onPointer = (e: PointerEvent) => {
      if (root?.contains(e.target as Node)) return;
      focusInside = false; // a click elsewhere keeps focus wherever the user put it
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      if (focusInside) trigger?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm whitespace-nowrap transition-colors ${
          active
            ? "border-neutral-dark bg-neutral-dark text-neutral-light"
            : "border-line bg-surface hover:border-neutral-dark/40"
        }`}
      >
        {label}
        <ChevronIcon
          direction="down"
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          className={`absolute top-full z-40 mt-2 min-w-72 animate-rise rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-neutral-dark/10 ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}
