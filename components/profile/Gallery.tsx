"use client";

import { SmartImage } from "../ui/SmartImage";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronIcon, GridIcon, XIcon } from "../icons";

type Photo = { id: string; url: string; alt: string; width: number; height: number };

/** Mosaic of the first five photos, opening a full-screen lightbox. */
export function Gallery({ photos, artistName }: { photos: Photo[]; artistName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (!dialog.open) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  if (!photos.length) return null;
  const [hero, ...rest] = photos;
  const side = rest.slice(0, 4);
  const current = photos[index];

  return (
    <>
      {/* Mobile: swipeable strip */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:hidden">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => open(i)}
            className="relative aspect-[4/5] w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl bg-secondary"
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
          >
            <SmartImage src={photo.url} alt={photo.alt} fill priority={i === 0} sizes="80vw" className="object-cover" />
          </button>
        ))}
      </div>

      {/* Desktop: mosaic */}
      <div className="relative hidden h-[30rem] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:grid">
        <button
          type="button"
          onClick={() => open(0)}
          className="group relative col-span-2 row-span-2 overflow-hidden bg-secondary"
          aria-label={`Open photo 1 of ${photos.length}`}
        >
          <SmartImage
            src={hero.url}
            alt={hero.alt}
            fill
            priority
            sizes="(min-width: 1280px) 640px, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </button>
        {side.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => open(i + 1)}
            className="group relative overflow-hidden bg-secondary"
            aria-label={`Open photo ${i + 2} of ${photos.length}`}
          >
            <SmartImage
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 1280px) 320px, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            />
          </button>
        ))}
        <button
          type="button"
          onClick={() => open(0)}
          className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-neutral-light/95 px-4 py-2 text-sm font-medium shadow-md backdrop-blur transition-transform hover:scale-[1.03]"
        >
          <GridIcon className="size-4" />
          Show all {photos.length} photos
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`${artistName}’s portfolio`}
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-neutral-dark/95 p-0 text-neutral-light backdrop:bg-neutral-dark/80"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm tabular-nums text-neutral-light/70" aria-live="polite">
              {index + 1} / {photos.length}
            </p>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close gallery"
              className="grid size-10 place-items-center rounded-full hover:bg-neutral-light/10"
            >
              <XIcon className="size-5" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-2 pb-6 sm:px-20">
            <div
              className="relative h-full max-h-[80dvh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <SmartImage
                key={current.id}
                src={current.url}
                alt={current.alt}
                fill
                sizes="100vw"
                className="animate-rise object-contain"
              />
            </div>
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 grid size-12 place-items-center rounded-full bg-neutral-light/10 hover:bg-neutral-light/20 sm:left-6"
                >
                  <ChevronIcon direction="left" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-2 grid size-12 place-items-center rounded-full bg-neutral-light/10 hover:bg-neutral-light/20 sm:right-6"
                >
                  <ChevronIcon direction="right" className="size-5" />
                </button>
              </>
            )}
          </div>
          <p className="px-6 pb-5 text-center text-xs text-neutral-light/60">{current.alt}</p>
        </div>
      </dialog>
    </>
  );
}
