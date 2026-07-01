import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { resolveConvexCompanyId } from "../forms/shared";

type CalendarStateMessaging = {
  message: string;
  showFallbackEmail: boolean;
  copySource: "ai" | "manual";
};

type CalendarMessaging = {
  closed: CalendarStateMessaging;
  unavailable: CalendarStateMessaging;
  noAvailability: CalendarStateMessaging;
};

export const getCalendarMessagingForPublic = query({
  args: {
    companyId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    bookingClosed: boolean;
    calendarMessaging: CalendarMessaging | null;
  }> => {
    const companyId = await resolveConvexCompanyId(ctx.db, args.companyId);
    const company = await ctx.db.get(companyId as Id<"companies">);
    return {
      bookingClosed: company?.bookingClosed ?? false,
      calendarMessaging: company?.calendarMessaging ?? null,
    };
  },
});
