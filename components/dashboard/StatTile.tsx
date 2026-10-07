export function StatTile({
  label,
  value,
  detail,
  highlight,
}: {
  label: string;
  value: string;
  detail?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight ? "border-primary/40 bg-secondary/40" : "border-line bg-surface"
      }`}
    >
      <p className="mb-3 text-xs tracking-wide text-ink-muted uppercase">{label}</p>
      <p className="font-playfair-display text-3xl tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs text-ink-muted">{detail}</p>}
    </div>
  );
}
