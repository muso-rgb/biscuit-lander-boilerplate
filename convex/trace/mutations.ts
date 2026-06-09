import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { resolveConvexCompanyId } from "../forms/shared";

async function bootstrapTrace(ctx: any, args: {
  companyId: string;
  landerUrl?: string;
  fbclid?: string;
  existingTraceId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  experimentId?: string;
  variant?: string;
}): Promise<string> {
  const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
  if (args.existingTraceId) {
    const existing = await ctx.db
      .query("adClickEvents")
      .withIndex("by_company_trace", (q: any) =>
        q.eq("companyId", companyId).eq("traceId", args.existingTraceId),
      )
      .first();
    if (existing) return existing.traceId;
  }

  if (args.fbclid) {
    const existing = await ctx.db
      .query("adClickEvents")
      .withIndex("by_company_fbclid", (q: any) =>
        q.eq("companyId", companyId).eq("fbclid", args.fbclid),
      )
      .first();
    if (existing) return existing.traceId;
  }

  const traceId = args.existingTraceId ?? crypto.randomUUID();
  const now = Date.now();
  await ctx.db.insert("adClickEvents", {
    companyId,
    traceId,
    fbclid: args.fbclid,
    utmSource: args.utmSource,
    utmMedium: args.utmMedium,
    utmCampaign: args.utmCampaign,
    utmContent: args.utmContent,
    utmTerm: args.utmTerm,
    experimentId: args.experimentId,
    variant: args.variant,
    landerUrl: args.landerUrl,
    createdAt: now,
    updatedAt: now,
  });
  return traceId;
}

const traceArgs = {
  companyId: v.string(),
  landerUrl: v.optional(v.string()),
  fbclid: v.optional(v.string()),
  existingTraceId: v.optional(v.string()),
  utmSource: v.optional(v.string()),
  utmMedium: v.optional(v.string()),
  utmCampaign: v.optional(v.string()),
  utmContent: v.optional(v.string()),
  utmTerm: v.optional(v.string()),
  experimentId: v.optional(v.string()),
  variant: v.optional(v.string()),
};

export const traceBootstrap = internalMutation({
  args: traceArgs,
  handler: bootstrapTrace,
});

export const traceBootstrapPublic = mutation({
  args: traceArgs,
  handler: bootstrapTrace,
});
