"use client";

import Image from "next/image";
import { SubCategories } from "./SubCategories";
import { useRouter } from "next/navigation";

interface CategoryProps {
  id?: string;
  image: string;
  heading: string;
  description: string;
  subcategories: string[];
  isReverse?: boolean;
}

export const Category = ({
  image,
  heading,
  description,
  subcategories,
  isReverse,
}: CategoryProps) => {
  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("category", heading);
    const slug = heading
      .toLowerCase()
      .replace(/[\/]/g, "-")
      .replace(/[&]/g, "and")
      .replace(/\s+/g, "-");

    const route = `/categories/${slug}`;
    router.push(route);
  };

  return (
    <div
      onClick={handleClick}
      className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 lg:gap-16 group cursor-pointer pb-8 md:p-8 transition-all duration-300 hover:bg-secondary/20"
    >
      <div
        className={`col-span-1 flex relative overflow-hidden w-[450px] h-[450px] md:w-[350px] md:h-[350px] lg:w-[450px] lg:h-[450px] ${
          isReverse
            ? "md:order-2 md:justify-self-start"
            : "md:order-1 md:justify-self-end"
        }`}
      >
        <Image
          src={image}
          width={450}
          height={450}
          alt=""
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      </div>
      <div
        className={`text-center col-span-1 w-[450px] md:w-[350px] lg:w-[450px] ${
          isReverse ? "md:order-1 md:flex justify-self-end" : "md:order-2"
        }`}
      >
        <div className="w-full">
          <h3 className="font-playfair-display text-3xl font-medium transition-all duration-500 group-hover:scale-105 mb-2">
            {heading}
          </h3>
          <p className="max-w-60 mx-auto mb-8 text-neutral-dark/60 transition-colors duration-300 group-hover:text-neutral-dark/80">
            {description}
          </p>
          <SubCategories subcategories={subcategories} />
          <button className="uppercase cursor-pointer text-sm mt-8 relative overflow-hidden tracking-widest">
            <span className="relative z-10 flex gap-1 items-center">
              <span>Learn More</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                />
              </svg>
            </span>
            <div className="absolute bottom-0 left-0 h-px bg-neutral-dark w-0 group-hover:w-full transition-all duration-500 ease-in-out" />
          </button>
        </div>
      </div>
    </div>
  );
};
