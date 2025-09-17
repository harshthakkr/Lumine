import Link from "next/link";

export const FooterLink = ({ text }: { text: string }) => {
  return (
    <li>
      <Link
        href="#"
        className="text-xs font-light hover:text-accent duration-200"
      >
        {text}
      </Link>
    </li>
  );
};
