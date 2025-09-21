import Image from "next/image";
import { CTA } from "./CTA";
import { useRouter } from "next/navigation";

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
                  <svg
                    className="absolute inset-0 w-4 h-4 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${fillPercentage}%` }}
                  >
                    <svg
                      className="w-4 h-4 text-accent"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
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
        <Image
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
