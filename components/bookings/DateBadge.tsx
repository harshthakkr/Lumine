import { dateBadge } from "@/lib/format";

export function DateBadge({
  date,
  timeZone,
  tone = "light",
}: {
  date: Date;
  timeZone: string;
  tone?: "light" | "dark";
}) {
  const { weekday, day, month } = dateBadge(date, timeZone);
  return (
    <div
      className={`flex w-14 shrink-0 flex-col items-center rounded-xl py-2 leading-none ${
        tone === "dark" ? "bg-neutral-light/10 text-neutral-light" : "bg-secondary/60 text-neutral-dark"
      }`}
    >
      <span className="text-[10px] tracking-widest uppercase opacity-70">{weekday}</span>
      <span className="my-1 font-playfair-display text-2xl">{day}</span>
      <span className="text-[10px] tracking-widest uppercase opacity-70">{month}</span>
    </div>
  );
}
