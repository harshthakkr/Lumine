"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { setFavorite } from "@/app/artists/actions";
import { HeartIcon } from "../icons";

export function FavoriteButton({
  artistId,
  artistName,
  saved,
  variant = "overlay",
}: {
  artistId: string;
  artistName: string;
  saved: boolean;
  variant?: "overlay" | "inline";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  const toggle = (event: React.MouseEvent) => {
    // Cards are links; the heart must not navigate.
    event.preventDefault();
    event.stopPropagation();
    const next = !optimisticSaved;
    startTransition(async () => {
      setOptimisticSaved(next);
      const result = await setFavorite(artistId, next);
      if (!result.ok && result.reason === "auth") {
        const back = pathname + (search.size ? `?${search}` : "");
        router.push(`/sign-in?next=${encodeURIComponent(back)}`);
        return;
      }
      router.refresh();
    });
  };

  const label = optimisticSaved ? `Remove ${artistName} from saved` : `Save ${artistName}`;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimisticSaved}
        aria-label={label}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm transition-colors hover:border-primary/50"
      >
        <HeartIcon
          filled={optimisticSaved}
          className={`size-4 transition-transform duration-300 ${optimisticSaved ? "scale-110 text-accent" : ""}`}
        />
        {optimisticSaved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimisticSaved}
      aria-label={label}
      className="grid size-9 cursor-pointer place-items-center rounded-full bg-neutral-light/85 text-neutral-dark shadow-sm backdrop-blur transition-transform duration-200 hover:scale-110 active:scale-95"
    >
      <HeartIcon
        filled={optimisticSaved}
        className={`size-[18px] transition-[color,transform] duration-300 ${optimisticSaved ? "scale-110 text-accent" : ""}`}
      />
    </button>
  );
}
