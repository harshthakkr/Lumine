import Link from "next/link";

export const Navbar = () => {
  return (
    <div className="flex justify-between items-center uppercase text-neutral-dark">
      <span className="font-playfair-display text-xl tracking-widest cursor-pointer">
        Luminé
      </span>
      <ul className="flex gap-10 font-inter text-sm font-light tracking-wider">
        <li>
          <Link href="#">Categories</Link>
        </li>
        <li>
          <Link href="#">Browse Artists</Link>
        </li>
        <li>
          <Link href="#">About</Link>
        </li>
        <li>
          <Link href="#">Contact</Link>
        </li>
      </ul>
      <button className="font-playfair-display bg-primary hover:bg-primary-hover duration-200 px-3 py-1 cursor-pointer">
        <Link href="#">Book Consultation</Link>
      </button>
    </div>
  );
};
