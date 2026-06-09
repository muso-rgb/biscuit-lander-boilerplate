"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ContactCaptureProps = {
  loading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  className?: string;
  onSubmit: (contact: { name: string; email: string; phone?: string }) => void;
};

export function ContactCapture({
  loading = false,
  error,
  title = "Where should we send the invite?",
  description = "Enter your details to see available times.",
  submitLabel = "Continue",
  className,
  onSubmit,
}: ContactCaptureProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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
            name,
            email,
            ...(phone.trim() && { phone }),
          });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="qualified-name">Name</Label>
          <Input
            id="qualified-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qualified-email">Email</Label>
          <Input
            id="qualified-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="qualified-phone">Phone</Label>
          <Input
            id="qualified-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
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
