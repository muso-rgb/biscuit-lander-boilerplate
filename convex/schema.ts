import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  formValidator,
  qualifiedContactValidator,
  userAnswerValidator,
  userFormResponseStatusValidator,
} from "./forms/validators";

const calendarStateMessagingValidator = v.object({
  message: v.string(),
  showFallbackEmail: v.boolean(),
  copySource: v.union(v.literal("ai"), v.literal("manual")),
});

export default defineSchema({
  companies: defineTable({
    name: v.string(),
    displayName: v.optional(v.string()),
    composioCompanyId: v.optional(v.string()),
    bookingClosed: v.optional(v.boolean()),
    calendarMessaging: v.optional(
      v.object({
        closed: calendarStateMessagingValidator,
        unavailable: calendarStateMessagingValidator,
        noAvailability: calendarStateMessagingValidator,
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  forms: defineTable({
    companyId: v.string(),
    name: v.string(),
    draftForm: formValidator,
    publishedForm: v.optional(formValidator),
    publishedVersion: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"]),

  userFormResponses: defineTable({
    companyId: v.string(),
    formId: v.string(),
    formVersion: v.number(),
    formSnapshot: formValidator,
    traceId: v.optional(v.string()),
    answers: v.array(userAnswerValidator),
    status: userFormResponseStatusValidator,
    isCalendarExposed: v.boolean(),
    contact: v.optional(qualifiedContactValidator),
    contactCapturedAt: v.optional(v.number()),
    disqualifiedAt: v.optional(v.number()),
    calendarExposedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_form", ["companyId", "formId"])
    .index("by_company_trace", ["companyId", "traceId"])
    .index("by_form_status", ["formId", "status"]),

  bookingIntakes: defineTable({
    companyId: v.string(),
    formId: v.string(),
    formResponseId: v.string(),
    traceId: v.optional(v.string()),
    contact: qualifiedContactValidator,
    calEventTypeId: v.number(),
    calBookingUid: v.optional(v.string()),
    status: v.union(
      v.literal("ready"),
      v.literal("booking"),
      v.literal("booked"),
      v.literal("failed"),
    ),
    closeLeadId: v.optional(v.string()),
    closeContactId: v.optional(v.string()),
    closeOpportunityId: v.optional(v.string()),
    selectedStartTime: v.optional(v.string()),
    selectedEndTime: v.optional(v.string()),
    selectedTimezone: v.optional(v.string()),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company_response", ["companyId", "formResponseId"])
    .index("by_company_trace", ["companyId", "traceId"]),

  calComConfig: defineTable({
    companyId: v.string(),
    composioCompanyId: v.optional(v.string()),
    eventTypeId: v.number(),
    eventTypeTitle: v.optional(v.string()),
    eventTypeSlug: v.optional(v.string()),
    eventTypeLengthInMinutes: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"]),

  closeConfig: defineTable({
    companyId: v.string(),
    apiKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_company", ["companyId"]),

  closeContactLinks: defineTable({
    companyId: v.string(),
    closeLeadId: v.string(),
    closeContactId: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    traceId: v.optional(v.string()),
    formResponseId: v.optional(v.string()),
    calBookingUid: v.optional(v.string()),
    source: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    pipelineId: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("won"),
      v.literal("lost"),
      v.literal("abandon"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_company_lead_id", ["companyId", "closeLeadId"])
    .index("by_company_email", ["companyId", "email"])
    .index("by_company_trace", ["companyId", "traceId"]),

  adClickEvents: defineTable({
    companyId: v.string(),
    traceId: v.string(),
    fbclid: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    experimentId: v.optional(v.string()),
    variant: v.optional(v.string()),
    landerUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company_trace", ["companyId", "traceId"])
    .index("by_company_fbclid", ["companyId", "fbclid"]),

  funnelEvents: defineTable({
    companyId: v.string(),
    traceId: v.string(),
    stage: v.union(
      v.literal("form_start"),
      v.literal("form_disqualified"),
      v.literal("calendar_exposed"),
      v.literal("call_booked"),
    ),
    occurredAt: v.number(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_company_trace", ["companyId", "traceId"]),
});
