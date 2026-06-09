import { v } from "convex/values";
import { internalMutation, mutation } from "../../_generated/server";
import { resolveConvexCompanyId } from "../../forms/shared";

export const upsertCloseConfig = mutation({
  args: {
    companyId: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const now = Date.now();
    const existing = await ctx.db
      .query("closeConfig")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { apiKey: args.apiKey, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("closeConfig", {
      companyId,
      apiKey: args.apiKey,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertCloseContactLink = internalMutation({
  args: {
    companyId: v.string(),
    closeLeadId: v.string(),
    closeContactId: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    traceId: v.optional(v.string()),
    formResponseId: v.optional(v.string()),
    calBookingUid: v.optional(v.string()),
    source: v.optional(v.string()),
    lastError: v.optional(v.string()),
    pipelineId: v.optional(v.string()),
    closeOpportunityId: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("open"), v.literal("won"), v.literal("lost"), v.literal("abandon")),
    ),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const now = Date.now();
    let existing = null;
    if (args.traceId) {
      existing = await ctx.db
        .query("closeContactLinks")
        .withIndex("by_company_trace", (q) =>
          q.eq("companyId", companyId).eq("traceId", args.traceId),
        )
        .first();
    }
    if (!existing && args.email) {
      existing = await ctx.db
        .query("closeContactLinks")
        .withIndex("by_company_email", (q) =>
          q.eq("companyId", companyId).eq("email", args.email),
        )
        .first();
    }
    if (!existing) {
      existing = await ctx.db
        .query("closeContactLinks")
        .withIndex("by_company_lead_id", (q) =>
          q.eq("companyId", companyId).eq("closeLeadId", args.closeLeadId),
        )
        .first();
    }

    const patch = {
      closeLeadId: args.closeLeadId,
      closeContactId: args.closeContactId,
      email: args.email,
      phone: args.phone,
      traceId: args.traceId,
      formResponseId: args.formResponseId,
      calBookingUid: args.calBookingUid,
      source: args.source,
      lastError: args.lastError,
      pipelineId: args.pipelineId,
      status: args.status ?? existing?.status ?? "open",
      lastSyncedAt: now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("closeContactLinks", {
      companyId,
      ...patch,
      createdAt: now,
    });
  },
});

export const setCloseContactLinkError = internalMutation({
  args: {
    companyId: v.string(),
    traceId: v.optional(v.string()),
    email: v.optional(v.string()),
    lastError: v.string(),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const now = Date.now();
    let existing = null;
    if (args.traceId) {
      existing = await ctx.db
        .query("closeContactLinks")
        .withIndex("by_company_trace", (q) =>
          q.eq("companyId", companyId).eq("traceId", args.traceId),
        )
        .first();
    }
    if (!existing && args.email) {
      existing = await ctx.db
        .query("closeContactLinks")
        .withIndex("by_company_email", (q) =>
          q.eq("companyId", companyId).eq("email", args.email),
        )
        .first();
    }
    if (existing) {
      await ctx.db.patch(existing._id, { lastError: args.lastError, updatedAt: now });
    }
  },
});
