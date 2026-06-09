import type { CalComEventType } from "./client";

function flattenEventTypeGroups(
  source: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const groups = source.eventTypeGroups;
  if (!Array.isArray(groups)) return [];
  const rows: Array<Record<string, unknown>> = [];
  for (const group of groups) {
    if (!group || typeof group !== "object") continue;
    const eventTypes = (group as Record<string, unknown>).eventTypes;
    if (Array.isArray(eventTypes)) {
      rows.push(...(eventTypes as Array<Record<string, unknown>>));
    }
  }
  return rows;
}

export function collectEventTypeRows(
  data: Record<string, unknown>,
): Array<Record<string, unknown>> {
  const candidates = [data.event_types, data.eventTypes, data.data, data.results, data.items];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as Array<Record<string, unknown>>;
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.event_types)) return nested.event_types as Array<Record<string, unknown>>;
      if (Array.isArray(nested.eventTypes)) return nested.eventTypes as Array<Record<string, unknown>>;
      const fromGroups = flattenEventTypeGroups(nested);
      if (fromGroups.length > 0) return fromGroups;
    }
  }
  return flattenEventTypeGroups(data);
}

export function parseCalComEventTypes(
  data: Record<string, unknown>,
): CalComEventType[] {
  const parsed: CalComEventType[] = [];
  for (const item of collectEventTypeRows(data)) {
    const idRaw = item.id ?? item.eventTypeId ?? item.event_type_id;
    const id =
      typeof idRaw === "number"
        ? idRaw
        : typeof idRaw === "string"
          ? Number.parseInt(idRaw, 10)
          : NaN;
    if (!Number.isFinite(id)) continue;
    const title =
      (typeof item.title === "string" && item.title) ||
      (typeof item.name === "string" && item.name) ||
      (typeof item.label === "string" && item.label) ||
      (typeof item.eventName === "string" && item.eventName) ||
      `Event type ${id}`;
    const slug =
      typeof item.slug === "string"
        ? item.slug
        : typeof item.eventTypeSlug === "string"
          ? item.eventTypeSlug
          : undefined;
    const lengthRaw = item.lengthInMinutes ?? item.length_in_minutes ?? item.length ?? item.duration;
    const lengthInMinutes =
      typeof lengthRaw === "number"
        ? lengthRaw
        : typeof lengthRaw === "string"
          ? Number.parseInt(lengthRaw, 10)
          : undefined;
    parsed.push({
      id,
      title,
      ...(slug !== undefined && { slug }),
      ...(Number.isFinite(lengthInMinutes ?? NaN) && { lengthInMinutes }),
    });
  }
  return parsed;
}
