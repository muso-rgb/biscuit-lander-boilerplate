import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { resolveConvexCompanyId } from "../forms/shared";

async function findBooking(
  ctx: any,
  args: { companyId: string; formResponseId?: string; traceId?: string },
) {
  if (args.formResponseId) {
    const byResponse = await ctx.db
      .query("bookingIntakes")
      .withIndex("by_company_response", (q: any) =>
        q.eq("companyId", args.companyId).eq("formResponseId", args.formResponseId),
      )
      .first();
    if (byResponse) return byResponse;
  }

  if (args.traceId) {
    return await ctx.db
      .query("bookingIntakes")
      .withIndex("by_company_trace", (q: any) =>
        q.eq("companyId", args.companyId).eq("traceId", args.traceId),
      )
      .first();
  }
  return null;
}

export const getBookingStatus = query({
  args: {
    companyId: v.string(),
    formResponseId: v.optional(v.string()),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const booking = await findBooking(ctx, {
      companyId,
      formResponseId: args.formResponseId,
      traceId: args.traceId,
    });

    if (booking) {
      return {
        companyId,
        formResponseId: booking.formResponseId,
        traceId: booking.traceId ?? null,
        status: booking.status,
        contactCaptured: true,
        selectedStartTime: booking.selectedStartTime ?? null,
        selectedEndTime: booking.selectedEndTime ?? null,
        selectedTimezone: booking.selectedTimezone ?? null,
        calBookingUid: booking.calBookingUid ?? null,
        lastError: booking.lastError ?? null,
        updatedAt: booking.updatedAt,
      };
    }

    if (!args.formResponseId) {
      return { companyId, formResponseId: null, traceId: args.traceId ?? null, status: "waiting" as const };
    }

    const response = await ctx.db
      .get(args.formResponseId as Id<"userFormResponses">)
      .catch(() => null);
    if (!response || response.companyId !== companyId) {
      return {
        companyId,
        formResponseId: args.formResponseId,
        traceId: args.traceId ?? null,
        status: "failed" as const,
        lastError: "Form response not found.",
      };
    }
    if (response.status !== "calendar_exposed") {
      return { companyId, formResponseId: args.formResponseId, traceId: response.traceId ?? null, status: "waiting" as const };
    }

    const config = await ctx.db
      .query("calComConfig")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .first();
    if (!config?.eventTypeId) {
      return {
        companyId,
        formResponseId: args.formResponseId,
        traceId: response.traceId ?? null,
        status: "failed" as const,
        lastError: "Cal.com event type is not configured.",
      };
    }

    return {
      companyId,
      formResponseId: args.formResponseId,
      traceId: response.traceId ?? null,
      status: "ready" as const,
      contactCaptured: !!response.contact,
      updatedAt: response.updatedAt,
    };
  },
});

export const getBookingForServer = internalQuery({
  args: {
    companyId: v.string(),
    formResponseId: v.optional(v.string()),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    return await findBooking(ctx, {
      companyId,
      formResponseId: args.formResponseId,
      traceId: args.traceId,
    });
  },
});
