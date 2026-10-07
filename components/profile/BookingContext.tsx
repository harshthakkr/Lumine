"use client";

import { createContext, useContext, useRef, useState, useTransition } from "react";
import { loadSlots } from "@/app/artists/actions";
import type { SlotDay } from "@/lib/queries/availability";
import type { ArtistService } from "@/lib/queries/artists";
import { SLOT_PAGE_DAYS } from "@/lib/availability";
import { addDays } from "@/lib/time";


type Availability = { from: string; days: SlotDay[] };

type BookingState = {
  artist: { id: string; slug: string; name: string; timezone: string; instantBook: boolean };
  services: ArtistService[];
  service: ArtistService;
  selectService: (id: string) => void;
  availability: Availability;
  loading: boolean;
  shiftRange: (direction: 1 | -1) => void;
  canGoBack: boolean;
  selectedDate: string | null;
  setSelectedDate: (date: string) => void;
  slot: string | null;
  setSlot: (iso: string | null) => void;
};

const Context = createContext<BookingState | null>(null);

export function useBooking() {
  const value = useContext(Context);
  if (!value) throw new Error("useBooking must be used inside <BookingProvider>");
  return value;
}

const firstOpenDate = (days: SlotDay[]) => days.find((d) => d.slots.length)?.date ?? days[0]?.date ?? null;

export function BookingProvider({
  artist,
  services,
  initialServiceId,
  initialAvailability,
  today,
  children,
}: {
  artist: BookingState["artist"];
  services: ArtistService[];
  initialServiceId: string;
  initialAvailability: Availability;
  /** Today in the artist's timezone; the earliest the picker can page back to. */
  today: string;
  children: React.ReactNode;
}) {
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [availability, setAvailability] = useState(initialAvailability);
  const [selectedDate, setSelectedDate] = useState(firstOpenDate(initialAvailability.days));
  const [slot, setSlot] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  // Ignore responses that arrive after a newer request was made.
  const requestId = useRef(0);

  const service = services.find((s) => s.id === serviceId) ?? services[0];

  const fetchRange = (nextServiceId: string, from: string, keepDate: boolean, seek = false) => {
    const id = ++requestId.current;
    startLoading(async () => {
      const result = await loadSlots({ artistId: artist.id, serviceId: nextServiceId, from, days: SLOT_PAGE_DAYS, seek });
      if (id !== requestId.current || !result) return;
      setAvailability({ from: result.from, days: result.days });
      setSelectedDate((current) =>
        keepDate && current && result.days.some((d) => d.date === current && d.slots.length)
          ? current
          : firstOpenDate(result.days),
      );
    });
  };

  const selectService = (id: string) => {
    if (id === serviceId) return;
    setServiceId(id);
    // A different duration changes which times fit, so the old pick is stale.
    setSlot(null);
    fetchRange(id, availability.from, true, true);
  };

  const shiftRange = (direction: 1 | -1) => {
    const from = addDays(availability.from, direction * SLOT_PAGE_DAYS);
    setSlot(null);
    fetchRange(serviceId, from < today ? today : from, false);
  };

  return (
    <Context
      value={{
        artist,
        services,
        service,
        selectService,
        availability,
        loading,
        shiftRange,
        canGoBack: availability.from > today,
        selectedDate,
        setSelectedDate: (date) => {
          setSelectedDate(date);
          setSlot(null);
        },
        slot,
        setSlot,
      }}
    >
      {children}
    </Context>
  );
}
