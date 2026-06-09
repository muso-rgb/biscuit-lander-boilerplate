import type { Metadata } from "next";
import { Suspense } from "react";
import { QualifyClient } from "./qualify-client";

export const metadata: Metadata = {
  title: "Application",
  description: "Qualification form and booking flow.",
};

export default function QualifyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading form...</div>}>
      <QualifyClient />
    </Suspense>
  );
}
