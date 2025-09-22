import Link from "next/link";

export const CTA = ({ onClick, id }: { onClick?: () => void; id?: string }) => {
  console.log("id", id);
  return (
    <button
      onClick={onClick}
      className="font-playfair-display text-neutral-light bg-primary hover:bg-primary-hover duration-200 px-4 py-2 cursor-pointer rounded-lg"
    >
      <Link href={id || "#top"}>Book Appointment</Link>
    </button>
  );
};
