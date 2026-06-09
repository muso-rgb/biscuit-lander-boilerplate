import { v } from "convex/values";
import { internalMutation, mutation } from "../../_generated/server";
import { resolveConvexCompanyId } from "../../forms/shared";

export const upsertCalComConfigInternal = internalMutation({
  args: {
    companyId: v.string(),
    composioCompanyId: v.optional(v.string()),
    eventTypeId: v.number(),
    eventTypeTitle: v.optional(v.string()),
    eventTypeSlug: v.optional(v.string()),
    eventTypeLengthInMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const now = Date.now();
    const existing = await ctx.db
      .query("calComConfig")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
    const patch = {
      composioCompanyId: args.composioCompanyId,
      eventTypeId: args.eventTypeId,
      eventTypeTitle: args.eventTypeTitle,
      eventTypeSlug: args.eventTypeSlug,
      eventTypeLengthInMinutes: args.eventTypeLengthInMinutes,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("calComConfig", {
      companyId,
      ...patch,
      createdAt: now,
    });
  },
});

export const upsertCalComConfig = mutation({
  args: {
    companyId: v.string(),
    composioCompanyId: v.optional(v.string()),
    eventTypeId: v.number(),
    eventTypeTitle: v.optional(v.string()),
    eventTypeSlug: v.optional(v.string()),
    eventTypeLengthInMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const now = Date.now();
    const existing = await ctx.db
      .query("calComConfig")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
    const patch = {
      composioCompanyId: args.composioCompanyId,
      eventTypeId: args.eventTypeId,
      eventTypeTitle: args.eventTypeTitle,
      eventTypeSlug: args.eventTypeSlug,
      eventTypeLengthInMinutes: args.eventTypeLengthInMinutes,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("calComConfig", {
        companyId,
        ...patch,
        createdAt: now,
      });
    }
    return { ok: true };
  },
});
