import { EmptyStarIcon } from "../icons/EmptyStartIcon";
import { FilledStarIcon } from "../icons/FilledStarIcon";

/** Five stars with fractional fill, e.g. 4.3 fills the fifth star 30%. */
export function StarRating({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(100, (rating - index) * 100));
        return (
          <span key={index} className="relative h-4 w-4">
            <EmptyStarIcon />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <FilledStarIcon />
            </span>
          </span>
        );
      })}
    </span>
  );
}
