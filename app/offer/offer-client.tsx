"use client";

import { useSearchParams } from "next/navigation";
import { QualifiedFormFlow } from "@/components/forms/qualified-form-flow";

export function OfferClient() {
  const searchParams = useSearchParams();
  const traceId = searchParams.get("trace_id") ?? undefined;
  const companyId = searchParams.get("companyId") ?? undefined;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Application</h1>
          {traceId ? (
            <p className="font-mono text-xs text-muted-foreground">trace_id={traceId}</p>
          ) : null}
        </div>
        {companyId ? (
          <QualifiedFormFlow companyId={companyId} traceId={traceId} />
        ) : (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            Missing companyId in URL.
          </div>
        )}
      </div>
    </main>
  );
}
