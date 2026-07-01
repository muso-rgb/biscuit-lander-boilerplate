"use client";

import { useSearchParams } from "next/navigation";
import { QualifiedFormFlow } from "@/components/forms/qualified-form-flow";
import { getFallbackContactEmail } from "@/content/fallback-contact";

export function QualifyClient() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId") ?? undefined;
  const traceId = searchParams.get("trace_id") ?? undefined;

  if (!companyId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Missing companyId.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <QualifiedFormFlow
          companyId={companyId}
          traceId={traceId}
          fallbackEmail={getFallbackContactEmail() ?? undefined}
        />
      </div>
    </main>
  );
}
