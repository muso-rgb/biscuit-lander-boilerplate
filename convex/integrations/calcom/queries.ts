import { v } from "convex/values";
import { internalQuery, query } from "../../_generated/server";
import { resolveConvexCompanyId } from "../../forms/shared";

export const getCalComConfig = query({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    return await ctx.db
      .query("calComConfig")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
  },
});

export const getCalComConfigInternal = internalQuery({
  args: { companyId: v.string() },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    return await ctx.db
      .query("calComConfig")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
  },
});
