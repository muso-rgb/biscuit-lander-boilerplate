/**
 * section-renderer.tsx
 *
 * Maps a section's `type` discriminant to its component.
 * The switch statement is the only place that needs updating when adding a
 * new section type. The `never` fallback enforces exhaustiveness at compile time:
 * if a new type is added to SectionContent without a matching case, tsc errors.
 */

import type { PageIntegrationsContent, SectionContent } from "@/content/schema"
import { Suspense } from "react"
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
  integrations?: PageIntegrationsContent
  fallbackEmail?: string
}

export function SectionRenderer({ section, integrations, fallbackEmail }: SectionRendererProps) {
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
        <Suspense
          fallback={
            <section id="application" className="section-pad pt-10">
              <div className="content-shell max-w-6xl">
                <div className="glass-card rounded-3xl px-6 py-10 text-center text-sm text-[color:var(--text-muted)] md:px-10">
                  Loading application…
                </div>
              </div>
            </section>
          }
        >
          <ApplicationSection
            content={section}
            integrationsCompanyId={integrations?.companyId}
            fallbackEmail={fallbackEmail}
          />
        </Suspense>
      )
    default: {
      // Exhaustiveness check: this line errors if a new union member has no case
      const _exhaustive: never = section
      return _exhaustive
    }
  }
}
