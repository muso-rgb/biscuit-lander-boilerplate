import { v } from "convex/values";
import { internalQuery, query } from "../../_generated/server";
import { resolveConvexCompanyId } from "../../forms/shared";

export const getCloseCredentials = internalQuery({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    return await ctx.db
      .query("closeConfig")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
  },
});

export const getCloseContactLinkByTrace = internalQuery({
  args: { companyId: v.string(), traceId: v.string() },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    return await ctx.db
      .query("closeContactLinks")
      .withIndex("by_company_trace", (q) =>
        q.eq("companyId", companyId).eq("traceId", args.traceId),
      )
      .first();
  },
});

export const getCloseContactLinkByEmail = internalQuery({
  args: { companyId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    return await ctx.db
      .query("closeContactLinks")
      .withIndex("by_company_email", (q) =>
        q.eq("companyId", companyId).eq("email", args.email.trim().toLowerCase()),
      )
      .first();
  },
});

export const getCloseConfig = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const config = await ctx.db
      .query("closeConfig")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
    return config ? { companyId, configured: true, updatedAt: config.updatedAt } : null;
  },
});
