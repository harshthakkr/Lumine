import { Navbar } from "@/components/Navbar";

/** Mirrors the profile layout so navigation from a card feels instant. */
export default function Loading() {
  return (
    <>
      <Navbar />
      <main aria-busy aria-label="Loading artist" className="mx-auto max-w-6xl animate-pulse px-4 pt-6 sm:px-8">
        <div className="mb-5 h-4 w-48 rounded bg-secondary/60" />
        <div className="mb-6 flex items-center gap-4">
          <div className="size-16 rounded-full bg-secondary/70 sm:size-20" />
          <div className="flex flex-col gap-2">
            <div className="h-8 w-64 rounded bg-secondary/70" />
            <div className="h-4 w-48 rounded bg-secondary/50" />
          </div>
        </div>
        <div className="grid h-[22rem] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl md:h-[30rem]">
          <div className="col-span-4 row-span-2 bg-secondary/60 md:col-span-2" />
          <div className="hidden bg-secondary/50 md:block" />
          <div className="hidden bg-secondary/50 md:block" />
          <div className="hidden bg-secondary/50 md:block" />
          <div className="hidden bg-secondary/50 md:block" />
        </div>
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-3">
            <div className="h-7 w-3/4 rounded bg-secondary/70" />
            <div className="h-4 w-full rounded bg-secondary/50" />
            <div className="h-4 w-5/6 rounded bg-secondary/50" />
          </div>
          <div className="hidden h-80 rounded-3xl bg-secondary/40 lg:block" />
        </div>
      </main>
    </>
  );
}
