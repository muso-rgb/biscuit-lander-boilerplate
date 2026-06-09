import { v } from "convex/values";
import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { resolveConvexCompanyId } from "./shared";

export const startUserFormResponse = mutation({
  args: {
    companyId: v.string(),
    formId: v.string(),
    traceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const form = await ctx.db.get(args.formId as Id<"forms">).catch(() => null);
    if (!form || form.companyId !== companyId) throw new Error("Form not found.");
    if (!form.publishedForm || !form.publishedVersion) {
      throw new Error("No published form is available.");
    }

    if (args.traceId) {
      const reusable = await ctx.db
        .query("userFormResponses")
        .withIndex("by_company_trace", (q) =>
          q.eq("companyId", companyId).eq("traceId", args.traceId),
        )
        .filter((q) => q.eq(q.field("status"), "in_progress"))
        .first();
      if (reusable) return { responseId: reusable._id };
    }

    const now = Date.now();
    const responseId = await ctx.db.insert("userFormResponses", {
      companyId,
      formId: args.formId,
      formVersion: form.publishedVersion,
      formSnapshot: form.publishedForm,
      traceId: args.traceId,
      answers: [],
      status: "in_progress",
      isCalendarExposed: false,
      createdAt: now,
      updatedAt: now,
    });

    if (args.traceId) {
      await ctx.db.insert("funnelEvents", {
        companyId,
        traceId: args.traceId,
        stage: "form_start",
        occurredAt: now,
        metadata: { formId: args.formId, responseId },
        createdAt: now,
      });
    }

    return { responseId };
  },
});

export const answerQuestion = mutation({
  args: {
    responseId: v.string(),
    questionId: v.string(),
    choiceId: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .get(args.responseId as Id<"userFormResponses">)
      .catch(() => null);
    if (!response) throw new Error("Response not found.");
    if (response.status === "disqualified") {
      throw new Error("This response is already disqualified.");
    }

    const question = response.formSnapshot.questions.find(
      (item: any) => item.id === args.questionId,
    );
    if (!question) throw new Error("Question not found.");

    const isAccepted = question.acceptedChoiceIds.includes(args.choiceId);
    const answers = [
      ...response.answers.filter((item: any) => item.questionId !== args.questionId),
      { questionId: args.questionId, choiceId: args.choiceId, isAccepted },
    ];
    const now = Date.now();

    if (!isAccepted) {
      await ctx.db.patch(response._id, {
        answers,
        status: "disqualified",
        isCalendarExposed: false,
        disqualifiedAt: now,
        updatedAt: now,
      });
      if (response.traceId) {
        await ctx.db.insert("funnelEvents", {
          companyId: response.companyId,
          traceId: response.traceId,
          stage: "form_disqualified",
          occurredAt: now,
          metadata: { responseId: response._id, questionId: args.questionId },
          createdAt: now,
        });
      }
      return { status: "disqualified" as const, nextQuestionId: null, isCalendarExposed: false };
    }

    if (question.nextQuestionId) {
      await ctx.db.patch(response._id, {
        answers,
        status: "in_progress",
        updatedAt: now,
      });
      return {
        status: "in_progress" as const,
        nextQuestionId: question.nextQuestionId,
        isCalendarExposed: false,
      };
    }

    await ctx.db.patch(response._id, {
      answers,
      status: "calendar_exposed",
      isCalendarExposed: true,
      calendarExposedAt: now,
      updatedAt: now,
    });
    if (response.traceId) {
      await ctx.db.insert("funnelEvents", {
        companyId: response.companyId,
        traceId: response.traceId,
        stage: "calendar_exposed",
        occurredAt: now,
        metadata: { responseId: response._id },
        createdAt: now,
      });
    }

    return { status: "calendar_exposed" as const, nextQuestionId: null, isCalendarExposed: true };
  },
});

export const saveQualifiedContact = mutation({
  args: {
    responseId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const response = await ctx.db
      .get(args.responseId as Id<"userFormResponses">)
      .catch(() => null);
    if (!response) throw new Error("Response not found.");
    if (response.status !== "calendar_exposed") {
      throw new Error("Contact can only be saved after qualification.");
    }

    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const phone = args.phone?.trim() || undefined;
    if (!name) throw new Error("Name is required.");
    if (!email || !email.includes("@")) throw new Error("Valid email is required.");

    await ctx.db.patch(response._id, {
      contact: { name, email, ...(phone && { phone }) },
      contactCapturedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { ok: true };
  },
});
