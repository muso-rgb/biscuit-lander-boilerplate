import type { Form } from "@/types/forms";
import type { Id } from "../_generated/dataModel";

export function makeDefaultPublishedForm(formId: string): Form {
  return {
    id: formId,
    startQuestionId: "ready-to-book",
    questions: [
      {
        id: "ready-to-book",
        text: "Are you ready to book a consultation?",
        choices: [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ],
        acceptedChoiceIds: ["yes"],
      },
    ],
  };
}

export async function resolveConvexCompanyId(
  db: any,
  companyIdParam: string,
): Promise<string> {
  const byId = await db.get(companyIdParam as Id<"companies">).catch(() => null);
  if (byId) return byId._id as string;

  const byName = await db
    .query("companies")
    .withIndex("by_name", (q: any) => q.eq("name", companyIdParam))
    .first();
  if (byName) return byName._id as string;

  const now = Date.now();
  return await db.insert("companies", {
    name: companyIdParam,
    displayName: companyIdParam,
    composioCompanyId: companyIdParam,
    createdAt: now,
    updatedAt: now,
  });
}
