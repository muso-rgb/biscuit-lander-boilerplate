"use client";

import { Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_DATES = [
  { label: "Today", slots: 6 },
  { label: "Tomorrow", slots: 18 },
  { label: "Wed, Jun 10", slots: 9 },
];

const PREVIEW_TIMES = ["9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"];

type LockedCalendarPreviewProps = {
  className?: string;
};

export function LockedCalendarPreview({ className }: LockedCalendarPreviewProps) {
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[420px] flex-col overflow-hidden rounded-lg border bg-card p-4 shadow-sm sm:p-5 lg:rounded-none lg:border-0 lg:shadow-none",
        className,
      )}
    >
      <div className="mb-4 space-y-1">
        <h2 className="text-base font-semibold text-primary">Strategy call calendar</h2>
        <p className="text-xs text-muted-foreground">Times shown in your timezone</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Globe className="size-3.5" />
          <span>Your timezone</span>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col">
        <div className="pointer-events-none select-none space-y-4 opacity-60 blur-[1.5px]">
          <div className="flex gap-2 overflow-hidden">
            {PREVIEW_DATES.map((date, index) => (
              <div
                key={date.label}
                className={cn(
                  "shrink-0 rounded-md border px-3 py-2 text-center text-xs",
                  index === 0
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border bg-muted/30 text-muted-foreground",
                )}
              >
                <div className="font-medium">{date.label}</div>
                <div className="opacity-80">{date.slots} slots</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Evening
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PREVIEW_TIMES.map((time) => (
                <div
                  key={time}
                  className="rounded-md border bg-background px-3 py-2 text-center text-xs"
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-background/10 p-4">
          <div className="max-w-xs rounded-xl border border-border/70 bg-card/75 px-5 py-4 text-center shadow-lg shadow-background/20 backdrop-blur-xl">
            <Lock className="mx-auto mb-2 size-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Calendar locked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete the questionnaire to unlock the calendar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
