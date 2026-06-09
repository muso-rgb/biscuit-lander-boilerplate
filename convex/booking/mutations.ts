import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { qualifiedContactValidator } from "../forms/validators";

const bookingStatusValidator = v.union(
  v.literal("ready"),
  v.literal("booking"),
  v.literal("booked"),
  v.literal("failed"),
);

export const ensureBookingReady = internalMutation({
  args: {
    companyId: v.string(),
    formId: v.string(),
    formResponseId: v.string(),
    traceId: v.optional(v.string()),
    contact: qualifiedContactValidator,
    calEventTypeId: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bookingIntakes")
      .withIndex("by_company_response", (q) =>
        q.eq("companyId", args.companyId).eq("formResponseId", args.formResponseId),
      )
      .first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        contact: args.contact,
        calEventTypeId: args.calEventTypeId,
        status: existing.status === "booked" ? "booked" : "ready",
        lastError: undefined,
        updatedAt: now,
      });
      return { bookingId: existing._id };
    }

    const bookingId = await ctx.db.insert("bookingIntakes", {
      companyId: args.companyId,
      formId: args.formId,
      formResponseId: args.formResponseId,
      traceId: args.traceId,
      contact: args.contact,
      calEventTypeId: args.calEventTypeId,
      status: "ready",
      createdAt: now,
      updatedAt: now,
    });
    return { bookingId };
  },
});

export const setBookingStatus = internalMutation({
  args: {
    companyId: v.string(),
    formResponseId: v.string(),
    status: bookingStatusValidator,
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookingIntakes")
      .withIndex("by_company_response", (q) =>
        q.eq("companyId", args.companyId).eq("formResponseId", args.formResponseId),
      )
      .first();
    if (!booking) return { updated: false };
    await ctx.db.patch(booking._id, {
      status: args.status,
      ...(args.lastError !== undefined && { lastError: args.lastError }),
      updatedAt: Date.now(),
    });
    return { updated: true };
  },
});

export const markAppointmentBooked = internalMutation({
  args: {
    companyId: v.string(),
    formResponseId: v.string(),
    traceId: v.optional(v.string()),
    calBookingUid: v.string(),
    selectedStartTime: v.string(),
    selectedEndTime: v.optional(v.string()),
    selectedTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookingIntakes")
      .withIndex("by_company_response", (q) =>
        q.eq("companyId", args.companyId).eq("formResponseId", args.formResponseId),
      )
      .first();
    if (!booking) throw new Error("Booking intake not found");

    await ctx.db.patch(booking._id, {
      status: "booked",
      calBookingUid: args.calBookingUid,
      selectedStartTime: args.selectedStartTime,
      selectedEndTime: args.selectedEndTime,
      selectedTimezone: args.selectedTimezone,
      lastError: undefined,
      updatedAt: Date.now(),
    });

    const traceId = args.traceId ?? booking.traceId;
    if (traceId) {
      await ctx.db.insert("funnelEvents", {
        companyId: args.companyId,
        traceId,
        stage: "call_booked",
        occurredAt: Date.now(),
        metadata: { formResponseId: args.formResponseId, calBookingUid: args.calBookingUid },
        createdAt: Date.now(),
      });
    }
  },
});

export const attachCloseLeadToBooking = internalMutation({
  args: {
    companyId: v.string(),
    formResponseId: v.string(),
    closeLeadId: v.string(),
    closeContactId: v.optional(v.string()),
    closeOpportunityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookingIntakes")
      .withIndex("by_company_response", (q) =>
        q.eq("companyId", args.companyId).eq("formResponseId", args.formResponseId),
      )
      .first();
    if (!booking) return { updated: false };
    await ctx.db.patch(booking._id, {
      closeLeadId: args.closeLeadId,
      closeContactId: args.closeContactId,
      closeOpportunityId: args.closeOpportunityId,
      updatedAt: Date.now(),
    });
    return { updated: true };
  },
});
