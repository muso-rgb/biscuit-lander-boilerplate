"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { type ReactNode, useMemo } from "react";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
  "http://127.0.0.1:3210";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
