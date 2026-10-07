"use client";

export function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={visible}
      aria-label={visible ? "Hide password" : "Show password"}
      className="cursor-pointer pb-1.5 text-xs font-medium text-ink-muted hover:text-neutral-dark"
    >
      {visible ? "Hide" : "Show"}
    </button>
  );
}
