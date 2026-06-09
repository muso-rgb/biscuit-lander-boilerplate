"use client"

import { useSearchParams } from "next/navigation"
import type { ApplicationSectionContent } from "@/content/schema"
import { resolveCompanyId } from "@/content/resolve-company-id"
import { QualifiedFormFlow } from "@/components/forms/qualified-form-flow"
import { SectionHeading, SectionLead } from "./section-primitives"

type ApplicationSectionProps = {
  content: ApplicationSectionContent
  integrationsCompanyId?: string
}

export function ApplicationSection({
  content,
  integrationsCompanyId,
}: ApplicationSectionProps) {
  const searchParams = useSearchParams()
  const companyId = resolveCompanyId({
    urlCompanyId: searchParams.get("companyId"),
    sectionCompanyId: content.companyId,
    integrationsCompanyId,
    devFallback: process.env.NEXT_PUBLIC_TEMPLATE_COMPANY_ID,
  })
  const traceId = searchParams.get("trace_id") ?? undefined

  return (
    <section id="application" className="section-pad pt-10">
      <div className="content-shell max-w-6xl">
        {(content.heading || content.subheading) && (
          <div className="mx-auto mb-8 max-w-3xl text-center">
            {content.heading ? <SectionHeading text={content.heading} /> : null}
            {content.subheading ? (
              <SectionLead
                text={content.subheading}
                className="mx-auto mt-4 text-center"
              />
            ) : null}
          </div>
        )}

        {companyId ? (
          <QualifiedFormFlow companyId={companyId} traceId={traceId} />
        ) : (
          <div className="rounded-lg border border-dashed bg-card/60 p-6 text-center text-sm text-muted-foreground">
            Application unavailable — missing companyId.
          </div>
        )}
      </div>
    </section>
  )
}
