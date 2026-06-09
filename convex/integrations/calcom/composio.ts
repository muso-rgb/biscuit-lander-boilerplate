"use node";

import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import type { CalComBooking, CalComEventType, CalComSlot } from "./client";
import { parseCalComEventTypes } from "./parsers";

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeToolData(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== "object") return {};
  const obj = result as Record<string, unknown>;
  const parsed = parseJsonLike(obj.data ?? obj);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}

export async function executeCalComTool(
  composioCompanyId: string,
  action: string,
  arguments_: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!process.env.COMPOSIO_API_KEY) {
    throw new Error("Missing env: COMPOSIO_API_KEY");
  }
  const composio = new Composio({ provider: new VercelProvider() });
  const result = await composio.tools.execute(action, {
    userId: composioCompanyId,
    dangerouslySkipVersionCheck: true,
    arguments: arguments_,
  });
  if (result && typeof result === "object" && (result as any).successful === false) {
    throw new Error(String((result as any).error ?? `Composio ${action} failed`));
  }
  return normalizeToolData(result);
}

function parseSlotItem(item: string | Record<string, unknown>): CalComSlot | null {
  if (typeof item === "string") return { startTime: item };
  const start =
    (typeof item.start === "string" && item.start) ||
    (typeof item.startTime === "string" && item.startTime) ||
    (typeof item.time === "string" && item.time);
  if (!start) return null;
  const end =
    (typeof item.end === "string" && item.end) ||
    (typeof item.endTime === "string" && item.endTime) ||
    undefined;
  return { startTime: start, endTime: end || undefined };
}

function collectSlotItems(source: unknown, depth = 0): Array<string | Record<string, unknown>> {
  if (depth > 3 || source == null) return [];
  if (Array.isArray(source)) return source as Array<string | Record<string, unknown>>;
  if (typeof source !== "object") return [];
  const obj = source as Record<string, unknown>;
  for (const candidate of [obj.slots, obj.availableSlots, obj.data, obj.results, obj.items]) {
    const items = collectSlotItems(candidate, depth + 1);
    if (items.length > 0) return items;
  }
  const items: Array<string | Record<string, unknown>> = [];
  for (const value of Object.values(obj)) {
    items.push(...collectSlotItems(value, depth + 1));
  }
  return items;
}

export function parseCalComSlots(data: Record<string, unknown>): CalComSlot[] {
  return collectSlotItems(data)
    .map((item) => parseSlotItem(item))
    .filter((slot): slot is CalComSlot => !!slot)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function parseCalComBooking(data: Record<string, unknown>): CalComBooking {
  const payload =
    data.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? (data.data as Record<string, unknown>)
      : data;
  const uidRaw = payload.uid ?? payload.bookingUid ?? payload.id ?? payload.bookingId;
  const uid = uidRaw != null ? String(uidRaw) : "";
  if (!uid) throw new Error("Cal.com booking response did not include a uid.");
  return {
    uid,
    start: typeof payload.start === "string" ? payload.start : typeof payload.startTime === "string" ? payload.startTime : undefined,
    end: typeof payload.end === "string" ? payload.end : typeof payload.endTime === "string" ? payload.endTime : undefined,
  };
}

export async function listCalComEventTypesViaComposio(
  composioCompanyId: string,
): Promise<CalComEventType[]> {
  const data = await executeCalComTool(composioCompanyId, "CAL_LIST_EVENT_TYPES", {});
  return parseCalComEventTypes(data);
}

export async function fetchCalComSlotsViaComposio(args: {
  composioCompanyId: string;
  eventTypeId: number;
  start: string;
  end: string;
  timeZone?: string;
}): Promise<CalComSlot[]> {
  const data = await executeCalComTool(
    args.composioCompanyId,
    "CAL_GET_AVAILABLE_SLOTS_INFO",
    {
      eventTypeId: args.eventTypeId,
      startTime: args.start,
      endTime: args.end,
      slotFormat: "range",
      ...(args.timeZone && { timeZone: args.timeZone }),
    },
  );
  return parseCalComSlots(data);
}

export async function createCalComBookingViaComposio(args: {
  composioCompanyId: string;
  eventTypeId: number;
  startTime: string;
  attendee: { name: string; email: string; phone?: string; timeZone: string };
  metadata?: Record<string, string>;
}): Promise<CalComBooking> {
  const responses: Record<string, string> = {
    name: args.attendee.name,
    email: args.attendee.email,
  };
  if (args.attendee.phone) responses.phone = args.attendee.phone;
  const data = await executeCalComTool(
    args.composioCompanyId,
    "CAL_POST_NEW_BOOKING_REQUEST",
    {
      start: args.startTime,
      eventTypeId: args.eventTypeId,
      language: "en",
      timeZone: args.attendee.timeZone,
      responses,
      ...(args.metadata && { metadata: args.metadata }),
    },
  );
  return parseCalComBooking(data);
}
