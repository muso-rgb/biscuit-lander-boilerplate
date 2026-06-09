"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  createCalComBookingViaComposio,
  fetchCalComSlotsViaComposio,
  listCalComEventTypesViaComposio,
} from "../integrations/calcom/composio";

function assertCalendarExposedResponse(response: any): asserts response is any {
  if (!response) throw new Error("Form response not found.");
  if (response.status !== "calendar_exposed" || !response.isCalendarExposed) {
    throw new Error("Calendar is not exposed for this response.");
  }
}

function assertQualifiedResponse(response: any): asserts response is any {
  assertCalendarExposedResponse(response);
  if (!response.contact) throw new Error("Contact details are required before booking.");
}

async function resolveCalComContext(ctx: any, companyId: string) {
  const config = await ctx.runQuery(
    internal.integrations.calcom.queries.getCalComConfigInternal,
    { companyId },
  );
  const composioCompanyId = config?.composioCompanyId ?? companyId;
  if (config?.eventTypeId) {
    return { composioCompanyId, eventTypeId: config.eventTypeId };
  }
  const [eventType] = await listCalComEventTypesViaComposio(composioCompanyId);
  if (!eventType) throw new Error("No Cal.com event types were found for this company.");
  await ctx.runMutation(
    internal.integrations.calcom.mutations.upsertCalComConfigInternal,
    {
      companyId,
      composioCompanyId,
      eventTypeId: eventType.id,
      eventTypeTitle: eventType.title,
      eventTypeSlug: eventType.slug,
      eventTypeLengthInMinutes: eventType.lengthInMinutes,
    },
  );
  return { composioCompanyId, eventTypeId: eventType.id };
}

export const fetchSlots = action({
  args: {
    companyId: v.string(),
    formResponseId: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ slots: Array<{ startTime: string; endTime?: string }> }> => {
    const response = await ctx.runQuery(
      internal.forms.queries.getUserFormResponseForServer,
      { responseId: args.formResponseId },
    );
    assertCalendarExposedResponse(response);
    const { composioCompanyId, eventTypeId } = await resolveCalComContext(ctx, response.companyId);
    const slots = await fetchCalComSlotsViaComposio({
      composioCompanyId,
      eventTypeId,
      start: new Date(args.startDate).toISOString(),
      end: new Date(args.endDate).toISOString(),
      timeZone: args.timezone,
    });
    return { slots };
  },
});

export const createAppointment = action({
  args: {
    companyId: v.string(),
    formResponseId: v.string(),
    startTime: v.string(),
    timezone: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: true; appointmentId: string; startTime?: string; endTime?: string }> => {
    const response = await ctx.runQuery(
      internal.forms.queries.getUserFormResponseForServer,
      { responseId: args.formResponseId },
    );
    assertQualifiedResponse(response);
    const existing = await ctx.runQuery(internal.booking.queries.getBookingForServer, {
      companyId: response.companyId,
      formResponseId: response._id,
      traceId: response.traceId,
    });
    if (existing?.status === "booked" && existing.calBookingUid) {
      return {
        ok: true,
        appointmentId: existing.calBookingUid,
        startTime: existing.selectedStartTime,
        endTime: existing.selectedEndTime,
      };
    }

    const { composioCompanyId, eventTypeId } = await resolveCalComContext(ctx, response.companyId);
    await ctx.runMutation(internal.booking.mutations.ensureBookingReady, {
      companyId: response.companyId,
      formId: response.formId,
      formResponseId: response._id,
      traceId: response.traceId,
      contact: response.contact,
      calEventTypeId: eventTypeId,
    });
    await ctx.runMutation(internal.booking.mutations.setBookingStatus, {
      companyId: response.companyId,
      formResponseId: response._id,
      status: "booking",
    });

    try {
      const booking = await createCalComBookingViaComposio({
        composioCompanyId,
        eventTypeId,
        startTime: args.startTime,
        attendee: {
          name: response.contact.name,
          email: response.contact.email,
          phone: response.contact.phone,
          timeZone: args.timezone ?? "UTC",
        },
        metadata: {
          companyId: response.companyId,
          formId: response.formId,
          formResponseId: response._id,
          ...(response.traceId && { traceId: response.traceId }),
        },
      });
      await ctx.runMutation(internal.booking.mutations.markAppointmentBooked, {
        companyId: response.companyId,
        formResponseId: response._id,
        traceId: response.traceId,
        calBookingUid: booking.uid,
        selectedStartTime: booking.start ?? args.startTime,
        selectedEndTime: booking.end,
        selectedTimezone: args.timezone,
      });
      await ctx.scheduler.runAfter(
        0,
        internal.integrations.close.action.syncCalComBookingToClose,
        {
          companyId: response.companyId,
          formResponseId: response._id,
          calBookingUid: booking.uid,
        },
      );
      return {
        ok: true,
        appointmentId: booking.uid,
        startTime: booking.start ?? args.startTime,
        endTime: booking.end,
      };
    } catch (error) {
      await ctx.runMutation(internal.booking.mutations.setBookingStatus, {
        companyId: response.companyId,
        formResponseId: response._id,
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});
