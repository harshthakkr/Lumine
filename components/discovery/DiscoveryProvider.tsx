"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useTransition } from "react";
import { toQueryString, type SearchFilters } from "@/lib/search-params";

type DiscoveryContext = {
  filters: SearchFilters;
  apply: (patch: Partial<SearchFilters>) => void;
  isPending: boolean;
};

const Context = createContext<DiscoveryContext | null>(null);

export function useDiscovery() {
  const value = useContext(Context);
  if (!value) throw new Error("useDiscovery must be used inside <DiscoveryProvider>");
  return value;
}

/** Filters live in the URL; applying one navigates inside a transition so results dim instead of flashing. */
export function DiscoveryProvider({
  filters,
  children,
}: {
  filters: SearchFilters;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const apply = (patch: Partial<SearchFilters>) => {
    const next = { ...filters, ...patch };
    startTransition(() => {
      router.push(`/artists${toQueryString(next)}` as `/artists`, { scroll: false });
    });
  };

  return <Context value={{ filters, apply, isPending }}>{children}</Context>;
}

export function ResultsFrame({ children }: { children: React.ReactNode }) {
  const { isPending } = useDiscovery();
  return (
    <div
      aria-busy={isPending}
      className={`transition-opacity duration-300 ${isPending ? "pointer-events-none opacity-50" : ""}`}
    >
      {children}
    </div>
  );
}
