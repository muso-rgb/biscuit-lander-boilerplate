import { pageContent } from "./load-content";

export function getFallbackContactEmail(override?: string | null): string | null {
  const trimmedOverride = override?.trim();
  if (trimmedOverride) return trimmedOverride;

  const footer = pageContent.site?.footer;
  const fallbackEmail = footer?.fallbackEmail?.trim();
  if (fallbackEmail) return fallbackEmail;

  const contactEmail = footer?.contactEmail?.trim();
  return contactEmail || null;
}
