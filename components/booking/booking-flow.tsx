"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  addDays,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Globe,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type Slot = {
  startTime: string;
  endTime?: string;
};

type BookingResult = {
  appointmentId: string;
  startTime?: string;
  endTime?: string;
};

type BookingFlowProps = {
  companyId: string;
  traceId?: string;
  formResponseId?: string;
  contactCaptured?: boolean;
  contactPanel?: ReactNode;
  variant?: "default" | "qualified";
};

const SLOT_PAGE_SIZE = 5;

function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function dayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function slotKey(slot: Slot): string {
  return `${slot.startTime}-${slot.endTime ?? ""}`;
}

function formatTimeRange(slot: Slot): string {
  const start = new Date(slot.startTime);
  const startLabel = Number.isNaN(start.getTime()) ? slot.startTime : format(start, "h:mm a");
  if (!slot.endTime) return startLabel;
  const end = new Date(slot.endTime);
  return Number.isNaN(end.getTime()) ? startLabel : `${startLabel} - ${format(end, "h:mm a")}`;
}

function formatDayTabLabel(date: Date, slotCount: number): string {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  if (isSameDay(date, today)) return `Today / ${slotCount} slots`;
  if (isSameDay(date, tomorrow)) return `Tomorrow / ${slotCount} slots`;
  return `${format(date, "EEE, MMM d")} / ${slotCount} slots`;
}

function getTimeOfDayLabel(slot: Slot): string {
  const hour = new Date(slot.startTime).getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function formatCalendarError(message: string): string {
  if (message.includes("event type is not configured")) {
    return "Booking is not set up yet. An administrator needs to select a Cal.com event type in Integrations.";
  }
  if (
    message.includes("ConnectedAccountNotFound") ||
    message.includes("No connected account found")
  ) {
    return "Cal.com needs to be reconnected in company Integrations settings.";
  }
  if (message.includes("No Cal.com event types were found")) {
    return "No Cal.com event types are available. Check Integrations and save an event type.";
  }
  return message;
}

export function BookingFlow({
  companyId,
  traceId,
  formResponseId,
  contactCaptured: contactCapturedOverride,
  contactPanel,
  variant = "default",
}: BookingFlowProps) {
  const timezone = useMemo(() => getBrowserTimezone(), []);
  const [currentMonth] = useState(() => startOfMonth(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slotPage, setSlotPage] = useState(0);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const status = useQuery(
    api.booking.queries.getBookingStatus,
    formResponseId || traceId ? { companyId, formResponseId, traceId } : "skip",
  );
  const fetchSlots = useAction(api.booking.actions.fetchSlots);
  const createAppointment = useAction(api.booking.actions.createAppointment);

  const isReady = status?.status === "ready";
  const isBooked = status?.status === "booked" || !!bookingResult;
  const statusContactCaptured =
    status && "contactCaptured" in status ? Boolean(status.contactCaptured) : false;
  const contactCaptured = contactCapturedOverride ?? statusContactCaptured;
  const effectiveFormResponseId =
    formResponseId ?? (typeof status?.formResponseId === "string" ? status.formResponseId : undefined);

  useEffect(() => {
    if (!isReady || !effectiveFormResponseId) return;
    let canceled = false;
    const loadSlots = async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      setSelectedSlot(null);
      try {
        const result = await fetchSlots({
          companyId,
          formResponseId: effectiveFormResponseId,
          startDate: startOfMonth(currentMonth).getTime(),
          endDate: endOfMonth(currentMonth).getTime(),
          timezone,
        });
        if (canceled) return;
        const nextSlots = (result.slots ?? []) as Slot[];
        setSlots(nextSlots);
        setSelectedDate((current) => {
          const selectedStillAvailable =
            current && nextSlots.some((slot) => dayKey(new Date(slot.startTime)) === dayKey(current));
          if (selectedStillAvailable) return current;
          const first = nextSlots[0];
          return first ? new Date(first.startTime) : null;
        });
      } catch (error) {
        if (canceled) return;
        setSlots([]);
        setSelectedDate(null);
        setSlotsError(formatCalendarError(error instanceof Error ? error.message : String(error)));
      } finally {
        if (!canceled) setSlotsLoading(false);
      }
    };
    void loadSlots();
    return () => {
      canceled = true;
    };
  }, [companyId, currentMonth, effectiveFormResponseId, fetchSlots, isReady, retryKey, timezone]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = dayKey(new Date(slot.startTime));
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [slots]);

  const availableDays = useMemo(
    () => Array.from(slotsByDay.keys()).sort().map((key) => new Date(`${key}T12:00:00`)),
    [slotsByDay],
  );
  const selectedDaySlots = selectedDate ? slotsByDay.get(dayKey(selectedDate)) ?? [] : [];
  const totalSlotPages = Math.max(1, Math.ceil(selectedDaySlots.length / SLOT_PAGE_SIZE));
  const currentSlotPage = Math.min(slotPage, totalSlotPages - 1);
  const paginatedDaySlots = selectedDaySlots.slice(
    currentSlotPage * SLOT_PAGE_SIZE,
    currentSlotPage * SLOT_PAGE_SIZE + SLOT_PAGE_SIZE,
  );
  const showSlotPagination = selectedDaySlots.length > SLOT_PAGE_SIZE;
  const timeOfDayLabel = selectedDaySlots.length > 0 ? getTimeOfDayLabel(selectedDaySlots[0]!) : null;
  const canConfirm = !!selectedSlot && !!effectiveFormResponseId && contactCaptured && !bookingLoading;
  const selectedDateKey = selectedDate ? dayKey(selectedDate) : null;

  useEffect(() => {
    setSlotPage(0);
  }, [selectedDateKey]);

  const handleBook = async () => {
    if (!selectedSlot || !effectiveFormResponseId || !contactCaptured) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const result = await createAppointment({
        companyId,
        formResponseId: effectiveFormResponseId,
        startTime: selectedSlot.startTime,
        timezone,
      });
      setBookingResult({
        appointmentId: result.appointmentId,
        startTime: result.startTime ?? selectedSlot.startTime,
        endTime: result.endTime ?? selectedSlot.endTime,
      });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : String(error));
      setRetryKey((value) => value + 1);
    } finally {
      setBookingLoading(false);
    }
  };

  if (!formResponseId && !traceId) return null;

  if (status?.status === "waiting") {
    return (
      <section className="w-full rounded-lg border border-dashed bg-muted/30 p-5 text-center text-sm text-muted-foreground">
        Complete the form to see available times.
      </section>
    );
  }

  if (!status || status.status === "booking") {
    const isBookingMeeting = status?.status === "booking";
    return (
      <section className="w-full rounded-lg border bg-background p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 size-4 animate-spin text-muted-foreground" />
          <div className="space-y-3">
            <p className="text-sm font-medium">
              {isBookingMeeting ? "We're booking your meeting..." : "Preparing available times..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {isBookingMeeting
                ? "Hang tight while we confirm your selected time and create the calendar invite."
                : "Finding available times for this calendar."}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (status.status === "failed") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Calendar unavailable</AlertTitle>
        <AlertDescription>
          {formatCalendarError(status.lastError ?? "We could not prepare a booking calendar.")}
        </AlertDescription>
      </Alert>
    );
  }

  if (isBooked) {
    const confirmedStart = bookingResult?.startTime ?? status.selectedStartTime ?? undefined;
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-lg border bg-background p-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Booking confirmed</h2>
            <p className="text-sm text-muted-foreground">
              {confirmedStart
                ? `You're booked for ${format(new Date(confirmedStart), "EEEE, MMMM d 'at' h:mm a")}.`
                : "Your appointment has been created."}
            </p>
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <section className="w-full rounded-lg border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5 space-y-1">
        <h2 className="text-lg font-semibold text-primary">
          {variant === "qualified" ? "Strategy call calendar" : "Book a time"}
        </h2>
        <p className="text-sm text-muted-foreground">
          You qualify for a call. Pick a time below
          {!contactCaptured ? ", then add your details to confirm." : " to confirm."}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="size-3.5" />
          <span>Times shown in {timezone.replaceAll("_", " ")}</span>
        </div>
      </div>

      {slotsLoading && (
        <div className="grid gap-2 sm:grid-cols-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {slotsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load availability</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>{slotsError}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              <RefreshCw className="mr-2 size-3" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!slotsLoading && !slotsError && availableDays.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableDays.map((date) => {
              const key = dayKey(date);
              const count = slotsByDay.get(key)?.length ?? 0;
              const selected = selectedDate && isSameDay(date, selectedDate);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                    setSlotPage(0);
                  }}
                  className={cn(
                    "shrink-0 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border bg-muted/20 text-foreground hover:bg-muted/40",
                  )}
                >
                  <div className="font-medium">{formatDayTabLabel(date, count).split(" / ")[0]}</div>
                  <div className={cn("opacity-80", selected && "text-primary-foreground/90")}>
                    {count} slots
                  </div>
                </button>
              );
            })}
          </div>

          {timeOfDayLabel && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {timeOfDayLabel}
            </p>
          )}

          <AnimatePresence mode="popLayout">
            <motion.div
              key={selectedDate ? dayKey(selectedDate) : "empty"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {paginatedDaySlots.map((slot) => {
                const selected = selectedSlot && slotKey(selectedSlot) === slotKey(slot);
                return (
                  <Button
                    key={slotKey(slot)}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    className="justify-center"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {formatTimeRange(slot)}
                  </Button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {showSlotPagination && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={currentSlotPage === 0}
                onClick={() => setSlotPage((page) => Math.max(0, page - 1))}
              >
                Previous
              </Button>
              <span>{currentSlotPage + 1} / {totalSlotPages}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={currentSlotPage >= totalSlotPages - 1}
                onClick={() => setSlotPage((page) => Math.min(totalSlotPages - 1, page + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {!slotsLoading && !slotsError && slots.length === 0 && (
        <div className="rounded-md border border-dashed bg-muted/30 p-5 text-center text-sm text-muted-foreground">
          No available times were found right now.
        </div>
      )}

      <div className="mt-5 space-y-4 border-t pt-5">
        <div className="rounded-md border bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <CalendarCheck className="size-4" />
            Selected slot
          </div>
          <p className="min-h-10 text-sm text-muted-foreground">
            {selectedSlot
              ? `${format(new Date(selectedSlot.startTime), "EEEE, MMM d")} at ${formatTimeRange(selectedSlot)}`
              : "Choose a date and time above."}
          </p>
          {bookingError && <p className="mt-2 text-xs text-destructive">{bookingError}</p>}
          {contactCaptured && (
            <Button type="button" className="mt-3 w-full" disabled={!canConfirm} onClick={handleBook}>
              {bookingLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Booking
                </>
              ) : (
                "Confirm appointment"
              )}
            </Button>
          )}
        </div>
        {!contactCaptured && contactPanel}
      </div>
    </section>
  );
}
