"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { CloseClient } from "./client";

export const syncCalComBookingToClose = internalAction({
  args: {
    companyId: v.string(),
    formResponseId: v.string(),
    calBookingUid: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const booking = await ctx.runQuery(internal.booking.queries.getBookingForServer, {
      companyId: args.companyId,
      formResponseId: args.formResponseId,
    });
    if (!booking) throw new Error("Booking intake not found for Close sync.");

    const credentials = await ctx.runQuery(
      internal.integrations.close.query.getCloseCredentials,
      { companyId: args.companyId },
    );
    if (!credentials?.apiKey) {
      await ctx.runMutation(internal.integrations.close.mutations.setCloseContactLinkError, {
        companyId: args.companyId,
        traceId: booking.traceId,
        email: booking.contact?.email,
        lastError: "Close config is missing for this company.",
      });
      return;
    }

    const contact = booking.contact;
    const client = new CloseClient({ apiKey: credentials.apiKey });

    try {
      let existingLink = null;
      if (booking.traceId) {
        existingLink = await ctx.runQuery(
          internal.integrations.close.query.getCloseContactLinkByTrace,
          { companyId: args.companyId, traceId: booking.traceId },
        );
      }
      if (!existingLink && contact.email) {
        existingLink = await ctx.runQuery(
          internal.integrations.close.query.getCloseContactLinkByEmail,
          { companyId: args.companyId, email: contact.email },
        );
      }

      let closeLeadId: string;
      let closeContactId: string | undefined;
      if (existingLink?.closeLeadId) {
        closeLeadId = existingLink.closeLeadId;
        closeContactId = existingLink.closeContactId;
        if (closeContactId) {
          await client.updateContact(closeContactId, {
            name: contact.name,
            emails: [{ email: contact.email, type: "office" }],
            ...(contact.phone && { phones: [{ phone: contact.phone, type: "office" }] }),
          });
        }
      } else {
        const foundLead = await client.searchLeadByEmail(contact.email);
        if (foundLead) {
          closeLeadId = foundLead.id;
          closeContactId = foundLead.contacts?.[0]?.id;
        } else {
          const lead = await client.createLead({
            name: contact.name,
            contacts: [
              {
                name: contact.name,
                emails: [{ email: contact.email, type: "office" }],
                ...(contact.phone && { phones: [{ phone: contact.phone, type: "office" }] }),
              },
            ],
          });
          closeLeadId = lead.id;
          closeContactId = lead.contacts?.[0]?.id;
        }
      }

      const opportunity = await client.createOpportunity({
        lead_id: closeLeadId,
        value: 0,
        note: `Cal.com booking ${args.calBookingUid}`,
      });

      await ctx.runMutation(internal.integrations.close.mutations.upsertCloseContactLink, {
        companyId: args.companyId,
        closeLeadId,
        closeContactId,
        closeOpportunityId: opportunity.id,
        email: contact.email,
        phone: contact.phone,
        traceId: booking.traceId,
        formResponseId: args.formResponseId,
        calBookingUid: args.calBookingUid,
        source: "calcom",
        lastError: undefined,
      });

      await ctx.runMutation(internal.booking.mutations.attachCloseLeadToBooking, {
        companyId: args.companyId,
        formResponseId: args.formResponseId,
        closeLeadId,
        closeContactId,
        closeOpportunityId: opportunity.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await ctx.runMutation(internal.integrations.close.mutations.setCloseContactLinkError, {
        companyId: args.companyId,
        traceId: booking.traceId,
        email: contact.email,
        lastError: message.slice(0, 500),
      });
      throw error;
    }
  },
});
