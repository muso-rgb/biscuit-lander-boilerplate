import type { Metadata } from "next";
import { Suspense } from "react";
import { OfferClient } from "./offer-client";

export const metadata: Metadata = {
  title: "Offer",
  description: "Qualification and booking flow.",
};

export default function OfferPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading offer page...</div>}>
      <OfferClient />
    </Suspense>
  );
}
