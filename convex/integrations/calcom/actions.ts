"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { CalComEventType } from "./client";
import { listCalComEventTypesViaComposio } from "./composio";

export const listCalComEventTypes = action({
  args: {
    companyId: v.string(),
  },
  handler: async (ctx, args): Promise<{ eventTypes: CalComEventType[] }> => {
    const config = await ctx.runQuery(
      internal.integrations.calcom.queries.getCalComConfigInternal,
      { companyId: args.companyId },
    );
    const composioCompanyId = config?.composioCompanyId ?? args.companyId;
    const eventTypes = await listCalComEventTypesViaComposio(composioCompanyId);

    if (!config?.eventTypeId && eventTypes[0]) {
      await ctx.runMutation(
        internal.integrations.calcom.mutations.upsertCalComConfigInternal,
        {
          companyId: config?.companyId ?? args.companyId,
          composioCompanyId,
          eventTypeId: eventTypes[0].id,
          eventTypeTitle: eventTypes[0].title,
          eventTypeSlug: eventTypes[0].slug,
          eventTypeLengthInMinutes: eventTypes[0].lengthInMinutes,
        },
      );
    }

    return { eventTypes };
  },
});

export const saveCalComEventTypeConfig = action({
  args: {
    companyId: v.string(),
    eventTypeId: v.number(),
    eventTypeTitle: v.optional(v.string()),
    eventTypeSlug: v.optional(v.string()),
    eventTypeLengthInMinutes: v.optional(v.number()),
    composioCompanyId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(
      internal.integrations.calcom.mutations.upsertCalComConfigInternal,
      {
        companyId: args.companyId,
        composioCompanyId: args.composioCompanyId ?? args.companyId,
        eventTypeId: args.eventTypeId,
        eventTypeTitle: args.eventTypeTitle,
        eventTypeSlug: args.eventTypeSlug,
        eventTypeLengthInMinutes: args.eventTypeLengthInMinutes,
      },
    );
    return { ok: true };
  },
});
