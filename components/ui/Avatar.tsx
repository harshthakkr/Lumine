import Image from "next/image";

const PALETTE = ["bg-secondary", "bg-[#efd9d6]", "bg-[#e3e6dc]", "bg-[#e2e0ee]", "bg-[#f2e3c9]"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 40,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        sizes={`${size * 2}px`}
        className={`shrink-0 rounded-full object-cover object-top ${className}`}
        style={style}
      />
    );
  }
  const tone = PALETTE[name.length % PALETTE.length];
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-neutral-dark/80 ${tone} ${className}`}
      style={{ ...style, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
