import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { makeDefaultPublishedForm, resolveConvexCompanyId } from "./forms/shared";

export const upsertDemoDataInternal = internalMutation({
  args: {
    companyId: v.string(),
    displayName: v.optional(v.string()),
    composioCompanyId: v.optional(v.string()),
    calEventTypeId: v.optional(v.number()),
    calEventTypeTitle: v.optional(v.string()),
    calEventTypeSlug: v.optional(v.string()),
    calEventTypeLengthInMinutes: v.optional(v.number()),
    closeApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    await ctx.db.patch(companyId as any, {
      displayName: args.displayName ?? args.companyId,
      composioCompanyId: args.composioCompanyId ?? args.companyId,
      updatedAt: now,
    });

    let form = await ctx.db
      .query("forms")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .first();
    const publishedForm = makeDefaultPublishedForm(form?._id ?? "demo-form");
    if (form) {
      const nextForm = makeDefaultPublishedForm(form._id);
      await ctx.db.patch(form._id, {
        name: "Qualification Form",
        draftForm: nextForm,
        publishedForm: nextForm,
        publishedVersion: form.publishedVersion ?? 1,
        publishedAt: form.publishedAt ?? now,
        updatedAt: now,
      });
    } else {
      const formId = await ctx.db.insert("forms", {
        companyId,
        name: "Qualification Form",
        draftForm: publishedForm,
        publishedForm,
        publishedVersion: 1,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      form = await ctx.db.get(formId);
      await ctx.db.patch(formId, {
        draftForm: makeDefaultPublishedForm(formId),
        publishedForm: makeDefaultPublishedForm(formId),
      });
    }

    if (args.calEventTypeId) {
      const existingCal = await ctx.db
        .query("calComConfig")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .first();
      const calPatch = {
        composioCompanyId: args.composioCompanyId ?? args.companyId,
        eventTypeId: args.calEventTypeId,
        eventTypeTitle: args.calEventTypeTitle,
        eventTypeSlug: args.calEventTypeSlug,
        eventTypeLengthInMinutes: args.calEventTypeLengthInMinutes,
        updatedAt: now,
      };
      if (existingCal) {
        await ctx.db.patch(existingCal._id, calPatch);
      } else {
        await ctx.db.insert("calComConfig", {
          companyId,
          ...calPatch,
          createdAt: now,
        });
      }
    }

    if (args.closeApiKey) {
      const existingClose = await ctx.db
        .query("closeConfig")
        .withIndex("by_company", (q) => q.eq("companyId", companyId))
        .first();
      if (existingClose) {
        await ctx.db.patch(existingClose._id, {
          apiKey: args.closeApiKey,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("closeConfig", {
          companyId,
          apiKey: args.closeApiKey,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { companyId, formId: form?._id ?? null };
  },
});

export const seedDemoData = action({
  args: {
    companyId: v.optional(v.string()),
    displayName: v.optional(v.string()),
    composioCompanyId: v.optional(v.string()),
    calEventTypeId: v.optional(v.number()),
    calEventTypeTitle: v.optional(v.string()),
    calEventTypeSlug: v.optional(v.string()),
    calEventTypeLengthInMinutes: v.optional(v.number()),
    closeApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const envCalId = process.env.CALCOM_EVENT_TYPE_ID
      ? Number.parseInt(process.env.CALCOM_EVENT_TYPE_ID, 10)
      : undefined;
    return await ctx.runMutation(internal.seed.upsertDemoDataInternal, {
      companyId: args.companyId ?? process.env.TEMPLATE_COMPANY_ID ?? "demo-company",
      displayName: args.displayName ?? process.env.TEMPLATE_COMPANY_NAME ?? "Demo Company",
      composioCompanyId:
        args.composioCompanyId ?? process.env.COMPOSIO_COMPANY_ID ?? args.companyId,
      calEventTypeId: args.calEventTypeId ?? (Number.isFinite(envCalId ?? NaN) ? envCalId : undefined),
      calEventTypeTitle: args.calEventTypeTitle ?? process.env.CALCOM_EVENT_TYPE_TITLE,
      calEventTypeSlug: args.calEventTypeSlug ?? process.env.CALCOM_EVENT_TYPE_SLUG,
      calEventTypeLengthInMinutes:
        args.calEventTypeLengthInMinutes ??
        (process.env.CALCOM_EVENT_TYPE_LENGTH_MINUTES
          ? Number.parseInt(process.env.CALCOM_EVENT_TYPE_LENGTH_MINUTES, 10)
          : undefined),
      closeApiKey: args.closeApiKey ?? process.env.CLOSE_API_KEY,
    });
  },
});
