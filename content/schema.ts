/**
 * content/schema.ts
 *
 * TypeScript types for the content.json-driven landing page system.
 *
 * HOW IT WORKS:
 * - PageContent is the root type for content.json
 * - Each section is a discriminated union member identified by `type`
 * - The `sections` array controls both content and render order
 *
 * FOR AGENTS EDITING CONTENT:
 * - Only edit content.json — never hardcode copy in components
 * - Reorder sections by reordering array entries in content.json
 * - Add a new section type by: (1) adding a new interface + union member here,
 *   (2) adding a case in section-renderer.tsx, (3) creating the component
 * - The TypeScript compiler will error if a new union member has no renderer case
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export interface CtaButton {
  label: string
  href: string
  /** Maps to Button variant prop. Omit to use component default. */
  variant?: "default" | "outline" | "secondary" | "ghost" | "link"
  /** Maps to Button size prop. Omit to use component default. */
  size?: "xs" | "sm" | "default" | "lg"
}

export interface NavLink {
  label: string
  href: string
}

export interface SiteHeaderContent {
  logoText: string
  navLinks: NavLink[]
  cta: CtaButton
}

export interface SiteFooterContent {
  contactEmail: string
  legalLinks: NavLink[]
  legalDisclaimer: string
  copyright: string
}

export interface SiteAnalyticsPosthogContent {
  key: string
  host?: string
}

export interface SiteAnalyticsContent {
  posthog?: SiteAnalyticsPosthogContent
}

export interface SiteContent {
  brand: string
  header: SiteHeaderContent
  footer: SiteFooterContent
  analytics?: SiteAnalyticsContent
}

// ─── Section content shapes ───────────────────────────────────────────────────

export interface MarqueeContent {
  type: "marquee"
  items: string[]
}

export interface HeroStatItem {
  value: string
  label: string
  detail: string
}

export interface HeroContent {
  type: "hero"
  badge: string
  heading: string
  subheading: string
  primaryCta: CtaButton
  caption: string
  stats: HeroStatItem[]
}

export interface LogoStripImage {
  /** Image URL or path (e.g. `/logos/acme.svg` or `https://…`). */
  src: string
  alt: string
}

export interface LogoStripContent {
  type: "logoStrip"
  label: string
  items: LogoStripImage[]
}

export interface ComparisonBarItem {
  label: string
  value: string
  /** Completion 0–100 (used with `Progress`). */
  progress: number
  highlight?: boolean
}

/** Single highlighted band row + progress (e.g. market size card). */
export interface OpportunityMarketBand {
  leftLabel: string
  rightLabel: string
  /** 0–100 */
  progress: number
}

export interface OpportunityCard {
  title: string
  stat: string
  /** Muted line under the main stat (e.g. “in 2 months”, “by 2030”). */
  statKicker?: string
  subtitle?: string
  marketBand?: OpportunityMarketBand
  footnote?: string
  description?: string
  comparison?: ComparisonBarItem[]
  bullets?: string[]
}

export interface OpportunityContent {
  type: "opportunity"
  label: string
  heading: string
  cards: OpportunityCard[]
}

export interface ProcessStep {
  title: string
  description: string
}

export interface ProcessContent {
  type: "process"
  label: string
  heading: string
  steps: ProcessStep[]
  tagline: string
}

export interface OfferFeatureItem {
  icon: string
  title: string
  description: string
}

export interface ComparisonColumn {
  title: string
  kicker: string
  items: string[]
}

export interface OfferContent {
  type: "offer"
  heading: string
  subheading: string
  items: OfferFeatureItem[]
  comparison: {
    left: ComparisonColumn
    right: ComparisonColumn
  }
}

export interface FeatureCardStat {
  label: string
  value: string
}

/** Row in the left “architecture” card: label + green status. */
export interface FeatureCardChecklistItem {
  label: string
  status: string
}

export interface FeatureCard {
  /** Small caps label above the title (e.g. “CLEAN ARCHITECTURE”). */
  category?: string
  title: string
  description: string
  items?: FeatureCardChecklistItem[]
  stats?: FeatureCardStat[]
}

export interface CapabilityItem {
  title: string
  description: string
}

export interface FeaturesContent {
  type: "features"
  /** Centered orange kicker above the heading (e.g. “EVERYTHING YOU NEED”). */
  label?: string
  heading: string
  subheading: string
  cards: FeatureCard[]
  capabilities: CapabilityItem[]
}

export interface RevenueStatItem {
  value: string
  label: string
  detail: string
}

export interface RoadmapMilestone {
  phase: string
  title: string
  detail: string
}

export interface RevenueContent {
  type: "revenue"
  label: string
  heading: string
  /** Centered label above the partner journey timeline. */
  journeyLabel?: string
  stats: RevenueStatItem[]
  roadmap: RoadmapMilestone[]
  trackRecord: RevenueStatItem[]
  /** Uppercase kicker in the track record card header. */
  trackRecordHeading?: string
  /** Shown next to a bullet in the track record header (e.g. “Verified”). */
  trackRecordVerified?: string
  footnote?: string
}

export interface ResultCaseStudy {
  niche: string
  stat: string
  detail: string
  timeline: string
  background: string
  services: string
}

export interface ResultsContent {
  type: "results"
  label: string
  heading: string
  subheading?: string
  items: ResultCaseStudy[]
}

export interface AudienceItem {
  title: string
  subtitle: string
  description: string
  tone?: "default" | "warning"
}

export interface AudienceContent {
  type: "audience"
  heading: string
  items: AudienceItem[]
  cta: CtaButton
}

export interface VideoTestimonialItem {
  videoId: string
  title: string
  label: string
  href: string
}

export interface VideoTestimonialsContent {
  type: "videoTestimonials"
  heading: string
  items: VideoTestimonialItem[]
}

export interface TeamMember {
  name: string
  role: string
  /** Short biography shown on the card. */
  bio: string
  linkedinUrl: string
  /** Used for initials when `avatarSrc` is omitted. */
  avatarLabel: string
  /** Optional headshot URL; when absent, initials are shown. */
  avatarSrc?: string
}

export interface TeamContent {
  type: "team"
  /** Small caps line above the heading (e.g. “Leadership team”). */
  label?: string
  heading: string
  items: TeamMember[]
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqContent {
  type: "faq"
  heading: string
  subheading?: string
  items: FaqItem[]
}

export interface FinalCtaContent {
  type: "finalCta"
  heading: string
  subheading: string
  cta: CtaButton
  caption: string
}

export interface ApplicationSectionContent {
  type: "application"
  heading?: string
  subheading?: string
  /** Injected by code-gen; fallback when URL has no companyId. */
  companyId?: string
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type SectionContent =
  | MarqueeContent
  | HeroContent
  | LogoStripContent
  | OpportunityContent
  | ProcessContent
  | OfferContent
  | FeaturesContent
  | RevenueContent
  | ResultsContent
  | AudienceContent
  | VideoTestimonialsContent
  | TeamContent
  | FaqContent
  | FinalCtaContent
  | ApplicationSectionContent

// ─── Root page shape ──────────────────────────────────────────────────────────

/** Non-secret integration identifiers injected by ad-misfits code-gen. */
export interface PageIntegrationsContent {
  /** ad-misfits Convex companies._id */
  companyId: string
  composioCompanyId?: string | null
  calEventTypeId?: number | null
}

export interface PageContent {
  site?: SiteContent
  /** Per-company integration ids (injected by code-gen; secrets stay in ad-misfits Convex). */
  integrations?: PageIntegrationsContent
  /** Ordered array of sections. Render order matches array order. */
  sections: SectionContent[]
}
