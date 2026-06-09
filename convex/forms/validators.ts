import { v } from "convex/values";

export const choiceValidator = v.object({
  id: v.string(),
  label: v.string(),
});

export const questionValidator = v.object({
  id: v.string(),
  text: v.string(),
  choices: v.array(choiceValidator),
  previousQuestionId: v.optional(v.string()),
  nextQuestionId: v.optional(v.string()),
  acceptedChoiceIds: v.array(v.string()),
});

export const formValidator = v.object({
  id: v.string(),
  startQuestionId: v.string(),
  questions: v.array(questionValidator),
});

export const userAnswerValidator = v.object({
  questionId: v.string(),
  choiceId: v.string(),
  isAccepted: v.boolean(),
});

export const userFormResponseStatusValidator = v.union(
  v.literal("in_progress"),
  v.literal("disqualified"),
  v.literal("calendar_exposed"),
);

export const qualifiedContactValidator = v.object({
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
});
