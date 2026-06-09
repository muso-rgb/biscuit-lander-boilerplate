/**
 * section-renderer.tsx
 *
 * Maps a section's `type` discriminant to its component.
 * The switch statement is the only place that needs updating when adding a
 * new section type. The `never` fallback enforces exhaustiveness at compile time:
 * if a new type is added to SectionContent without a matching case, tsc errors.
 */

import type { SectionContent } from "@/content/schema"
import { MarqueeSection } from "./marquee-section"
import { HeroSection } from "./hero-section"
import { LogoStripSection } from "./logo-strip-section"
import { OpportunitySection } from "./opportunity-section"
import { ProcessSection } from "./process-section"
import { OfferSection } from "./offer-section"
import { FeaturesSection } from "./features-section"
import { RevenueSection } from "./revenue-section"
import { ResultsSection } from "./results-section"
import { AudienceSection } from "./audience-section"
import { VideoTestimonialsSection } from "./video-testimonials-section"
import { TeamSection } from "./team-section"
import { FaqSection } from "./faq-section"
import { FinalCtaSection } from "./final-cta-section"
import { ApplicationSection } from "./application-section"

interface SectionRendererProps {
  section: SectionContent
}

export function SectionRenderer({ section }: SectionRendererProps) {
  switch (section.type) {
    case "marquee":
      return <MarqueeSection content={section} />
    case "hero":
      return <HeroSection content={section} />
    case "logoStrip":
      return <LogoStripSection content={section} />
    case "opportunity":
      return <OpportunitySection content={section} />
    case "process":
      return <ProcessSection content={section} />
    case "offer":
      return <OfferSection content={section} />
    case "features":
      return <FeaturesSection content={section} />
    case "revenue":
      return <RevenueSection content={section} />
    case "results":
      return <ResultsSection content={section} />
    case "audience":
      return <AudienceSection content={section} />
    case "videoTestimonials":
      return <VideoTestimonialsSection content={section} />
    case "team":
      return <TeamSection content={section} />
    case "faq":
      return <FaqSection content={section} />
    case "finalCta":
      return <FinalCtaSection content={section} />
    case "application":
      return (
        <ApplicationSection
          content={{
            ...section,
            companyId:
              section.companyId ??
              process.env.TEMPLATE_COMPANY_ID ??
              process.env.NEXT_PUBLIC_TEMPLATE_COMPANY_ID ??
              process.env.COMPOSIO_COMPANY_ID,
          }}
        />
      )
    default: {
      // Exhaustiveness check: this line errors if a new union member has no case
      const _exhaustive: never = section
      return _exhaustive
    }
  }
}
