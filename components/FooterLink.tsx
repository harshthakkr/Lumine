import Link from "next/link";

export const FooterLink = ({ text, id }: { text: string; id?: string }) => {
  console.log(id);
  return (
    <li>
      <Link
        href={id || "#top"}
        className="text-xs font-light hover:text-accent duration-200"
      >
        {text}
      </Link>
    </li>
  );
};
