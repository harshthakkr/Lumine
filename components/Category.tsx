"use client";

import { OptimizedImage } from "@/components/OptimizedImage";
import { SubCategories } from "./SubCategories";
import { useRouter } from "next/navigation";
import { RightArrowIcon } from "./icons/RightArrowIcon";

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
        className={`col-span-1 flex relative overflow-hidden w-full max-w-sm mx-auto md:max-w-none md:w-[350px] lg:w-[450px] aspect-square ${
          isReverse
            ? "md:order-2 md:justify-self-start"
            : "md:order-1 md:justify-self-end"
        }`}
      >
        <OptimizedImage
          src={image}
          width={450}
          height={450}
          alt={`${heading} model`}
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      </div>
      <div
        className={`text-center col-span-1 w-full max-w-sm mx-auto md:max-w-none md:w-[350px] lg:w-[450px] ${
          isReverse ? "md:order-1 md:flex justify-self-end" : "md:order-2"
        }`}
      >
        <div className="w-full px-4 md:p-0">
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
              <RightArrowIcon />
            </span>
            <div className="absolute bottom-0 left-0 h-px bg-neutral-dark w-0 group-hover:w-full transition-all duration-500 ease-in-out" />
          </button>
        </div>
      </div>
    </div>
  );
};
