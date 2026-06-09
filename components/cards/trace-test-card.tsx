"use client";

import { useState } from "react";
import type { TraceTestCardProps } from "@/types/components/cards/trace-test-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function createTestRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TraceTestCard({
  companyId,
  enabled,
  formReady,
  calcomConnected,
  closeConnected,
}: TraceTestCardProps) {
  const [copied, setCopied] = useState(false);
  const [testRunId, setTestRunId] = useState(() => createTestRunId());

  if (!enabled) {
    const requirements: { label: string; done: boolean }[] = [
      { label: "Publish a form", done: formReady },
      { label: "Connect Cal.com", done: calcomConnected },
      { label: "Connect Close CRM", done: closeConnected },
    ];
    return (
      <Card size="sm">
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Complete these to unlock the trace test URL:</p>
          <ul className="space-y-1">
            {requirements.map((req) => (
              <li key={req.label} className="flex items-center gap-2">
                <span className={req.done ? "text-green-600" : "text-muted-foreground"}>
                  {req.done ? "✓" : "○"}
                </span>
                <span className={req.done ? "text-foreground line-through" : ""}>
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  const base = APP_URL.replace(/\/$/, "") + "/trace";
  const traceUrl = `${base}?companyId=${encodeURIComponent(
    companyId,
  )}&redirect=/&testRunId=${encodeURIComponent(testRunId)}`;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Trace Test URL</CardTitle>
        <CardDescription>
          Use this URL to run an end-to-end attribution test. It will generate a{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[0.7rem]">trace_id</code>{" "}
          and redirect through the first-party application, Cal.com booking, and Close sync.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1 overflow-hidden rounded-md border bg-muted/40 px-2 py-1 text-xs">
            <div className="truncate">{traceUrl}</div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTestRunId(createTestRunId());
                setCopied(false);
              }}
            >
              Generate new URL
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(traceUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
            >
              {copied ? "Copied" : "Copy URL"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(traceUrl, "_blank", "noreferrer")}
            >
              Open
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Use a fresh URL for each test run to create a unique trace through the
            lander application section.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
