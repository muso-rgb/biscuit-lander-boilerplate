"use client";

import { cn } from "@/lib/utils";

type ApplicationStep = "form" | "book";

type ApplicationStepIndicatorProps = {
  activeStep: ApplicationStep;
  className?: string;
};

const STEPS: Array<{ id: ApplicationStep; label: string }> = [
  { id: "form", label: "Fill out the form" },
  { id: "book", label: "Book your event" },
];

export function ApplicationStepIndicator({
  activeStep,
  className,
}: ApplicationStepIndicatorProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 sm:gap-8", className)}>
      {STEPS.map((step) => {
        const active = step.id === activeStep;
        return (
          <div key={step.id} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2 rounded-full",
                active ? "bg-primary" : "bg-muted-foreground/40",
              )}
            />
            <span
              className={cn(
                active ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
