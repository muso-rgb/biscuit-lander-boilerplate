import rawContent from "./content.json"
import type { CtaButton, PageContent } from "./schema"

const CTA_SIZES = new Set<CtaButton["size"]>(["xs", "sm", "default", "lg"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function assertCta(value: unknown, path: string): void {
  if (!isRecord(value)) {
    throw new Error(`${path} must be an object`)
  }

  if (typeof value.label !== "string" || typeof value.href !== "string") {
    throw new Error(`${path} must include string label and href`)
  }

  if (value.size !== undefined && !CTA_SIZES.has(value.size as CtaButton["size"])) {
    throw new Error(`${path}.size must be one of xs, sm, default, lg`)
  }
}

function assertPageContent(value: unknown): asserts value is PageContent {
  if (!isRecord(value)) {
    throw new Error("content must be an object")
  }

  if (!isRecord(value.site)) {
    throw new Error("content.site must be an object")
  }

  if (!isRecord(value.site.header)) {
    throw new Error("content.site.header must be an object")
  }

  assertCta(value.site.header.cta, "content.site.header.cta")

  if (!Array.isArray(value.sections)) {
    throw new Error("content.sections must be an array")
  }

  for (const section of value.sections) {
    if (!isRecord(section) || typeof section.type !== "string") {
      throw new Error("Each section must be an object with a string type")
    }

    if (section.type === "hero") {
      assertCta(section.primaryCta, "content.sections[hero].primaryCta")
    }

    if (section.type === "audience" && section.cta !== undefined) {
      assertCta(section.cta, "content.sections[audience].cta")
    }

    if (section.type === "finalCta") {
      assertCta(section.cta, "content.sections[finalCta].cta")
    }
  }
}

function parsePageContent(value: unknown): PageContent {
  assertPageContent(value)
  return value
}

export const pageContent = parsePageContent(rawContent)
