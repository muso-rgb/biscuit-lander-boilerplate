import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { resolveConvexCompanyId } from "./shared";

export const getPublishedFormForPublic = query({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const form = await ctx.db
      .query("forms")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();

    return {
      companyId,
      formId: form?._id ?? null,
      form: form?.publishedForm ?? null,
      publishedVersion: form?.publishedVersion ?? null,
      publishedAt: form?.publishedAt ?? null,
    };
  },
});

export const getUserFormResponse = query({
  args: {
    responseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .get(args.responseId as Id<"userFormResponses">)
      .catch(() => null);
  },
});

export const getUserFormResponseForServer = internalQuery({
  args: {
    responseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .get(args.responseId as Id<"userFormResponses">)
      .catch(() => null);
  },
});
