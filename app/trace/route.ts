import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const companyId = url.searchParams.get("companyId");
  const redirectParam = url.searchParams.get("redirect") || "/";

  if (!companyId) {
    return new NextResponse("Missing companyId", { status: 400 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new NextResponse("Missing NEXT_PUBLIC_CONVEX_URL", { status: 500 });
  }

  const client = new ConvexHttpClient(convexUrl);
  const traceId = await client.mutation(api.trace.mutations.traceBootstrapPublic, {
    companyId,
    landerUrl: url.toString(),
    fbclid: url.searchParams.get("fbclid") ?? undefined,
    existingTraceId: url.searchParams.get("trace_id") ?? undefined,
    utmSource: url.searchParams.get("utm_source") ?? undefined,
    utmMedium: url.searchParams.get("utm_medium") ?? undefined,
    utmCampaign: url.searchParams.get("utm_campaign") ?? undefined,
    utmContent: url.searchParams.get("utm_content") ?? undefined,
    utmTerm: url.searchParams.get("utm_term") ?? undefined,
    experimentId: url.searchParams.get("experimentId") ?? undefined,
    variant: url.searchParams.get("variant") ?? undefined,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
  const redirectTarget =
    redirectParam.startsWith("http://") || redirectParam.startsWith("https://")
      ? new URL(redirectParam)
      : new URL(redirectParam.startsWith("/") ? redirectParam : `/${redirectParam}`, appUrl);

  redirectTarget.searchParams.set("companyId", companyId);
  redirectTarget.searchParams.set("trace_id", traceId);
  url.searchParams.forEach((value, key) => {
    if (!["redirect", "companyId", "trace_id"].includes(key)) {
      redirectTarget.searchParams.set(key, value);
    }
  });

  return NextResponse.redirect(redirectTarget, 302);
}
