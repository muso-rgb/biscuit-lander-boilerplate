/**
 * Resolve the Convex company id for the inline application form.
 * URL query param wins (trace / ad attribution), then injected content.json fields.
 */
export function resolveCompanyId(
  options: {
    urlCompanyId?: string | null
    sectionCompanyId?: string
    integrationsCompanyId?: string
    devFallback?: string
  } = {},
): string | undefined {
  const fromUrl = options.urlCompanyId?.trim()
  if (fromUrl) return fromUrl

  const fromSection = options.sectionCompanyId?.trim()
  if (fromSection) return fromSection

  const fromIntegrations = options.integrationsCompanyId?.trim()
  if (fromIntegrations) return fromIntegrations

  const fallback = options.devFallback?.trim()
  if (fallback) return fallback

  return undefined
}
