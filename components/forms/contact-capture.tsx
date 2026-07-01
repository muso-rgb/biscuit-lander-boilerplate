"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessionStorageState } from "@/hooks/use-session-storage-state";
import { cn } from "@/lib/utils";

type ContactDraft = {
  name: string;
  email: string;
  phone: string;
};

type ContactCaptureProps = {
  loading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
  storageKey?: string | null;
  onSubmit: (contact: { name: string; email: string; phone?: string }) => void;
};

export function ContactCapture({
  loading = false,
  error,
  title = "Where should we send the invite?",
  description = "Enter your details to see available times.",
  submitLabel = "Continue",
  className,
  storageKey,
  onSubmit,
}: ContactCaptureProps) {
  const [draft, setDraft] = useSessionStorageState<ContactDraft>(
    storageKey ?? null,
    { name: "", email: "", phone: "" },
  );

  return (
    <section className={cn("rounded-lg border bg-card p-4 shadow-sm sm:p-5", className)}>
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            name: draft.name,
            email: draft.email,
            ...(draft.phone.trim() && { phone: draft.phone }),
          });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="qualified-name">Name</Label>
          <Input
            id="qualified-name"
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            autoComplete="name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qualified-email">Email</Label>
          <Input
            id="qualified-email"
            type="email"
            value={draft.email}
            onChange={(event) =>
              setDraft((current) => ({ ...current, email: event.target.value }))
            }
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qualified-phone">Phone</Label>
          <Input
            id="qualified-phone"
            value={draft.phone}
            onChange={(event) =>
              setDraft((current) => ({ ...current, phone: event.target.value }))
            }
            autoComplete="tel"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </form>
    </section>
  );
}
