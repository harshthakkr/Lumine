import Link from "next/link";

export const CTA = () => {
  return (
    <button className="font-playfair-display text-neutral-light bg-primary hover:bg-primary-hover duration-200 px-3 py-1 cursor-pointer rounded-lg">
      <Link href="#">Book Consultation</Link>
    </button>
  );
};
