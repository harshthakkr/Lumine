"use client";

import { CTA } from "./CTA";
import { useRouter } from "next/navigation";
import { OptimizedImage } from "@/components/OptimizedImage";
import { EmptyStarIcon } from "./icons/EmptyStartIcon";
import { FilledStarIcon } from "./icons/FilledStarIcon";

export const Artist = ({
  name,
  profilePicture,
  price,
  ratings,
  ratingsCount,
}: {
  name: string;
  profilePicture: string;
  price: number;
  ratings: number;
  ratingsCount: number;
}) => {
  const router = useRouter();
  const handleClick = () => {
    localStorage.setItem("artist", name);
    localStorage.setItem("price", String(price));
    router.push("/submit");
  };
  return (
    <div className="col-span-1 flex flex-col-reverse lg:flex-row justify-between group bg-white border-[1px] border-secondary hover:border-primary/30 drop-shadow-sm hover:drop-shadow-md transition-all duration-300 p-4 lg:p-8 lg:w-140">
      <div>
        <h4 className="font-playfair-display text-xl mb-4">{name}</h4>
        <div className="text-2xl font-semibold text-primary mb-4">${price}</div>
        <div className="flex items-center gap-1 mb-6">
          <div className="flex items-center lg:gap-0.5">
            {Array.from({ length: 5 }, (_, index) => {
              const fillPercentage = Math.max(
                0,
                Math.min(100, (ratings - index) * 100)
              );
              return (
                <div key={index} className="relative w-4 h-4">
                  <EmptyStarIcon />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fillPercentage}%` }}
                  >
                    <FilledStarIcon />
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-sm">
            {ratings} ({ratingsCount} reviews)
          </span>
        </div>
        <CTA onClick={handleClick} />
      </div>
      <div className="overflow-hidden mb-2 lg:m-0">
        <OptimizedImage
          src={profilePicture}
          height={315}
          width={210}
          alt={`${name} profile picture`}
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      </div>
    </div>
  );
};
