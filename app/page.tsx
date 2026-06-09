import { pageContent } from "@/content/load-content"
import { PosthogProvider } from "@/components/analytics/posthog-provider"
import { SiteFooter } from "@/components/chrome/site-footer"
import { SiteHeader } from "@/components/chrome/site-header"
import { SectionRenderer } from "@/components/sections/section-renderer"
import { Suspense } from "react"

export default function Page() {
  return (
    <>
      <PosthogProvider
        brand={pageContent.site?.brand}
        apiKey={pageContent.site?.analytics?.posthog?.key}
        apiHost={pageContent.site?.analytics?.posthog?.host}
      />
      {pageContent.site ? (
        <SiteHeader
          content={pageContent.site.header}
          brand={pageContent.site.brand}
        />
      ) : null}
      <main className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_50%_0%,rgba(228,82,30,0.09),transparent_55%)]" />
        <div className="pointer-events-none absolute top-[26rem] left-[-10rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(228,82,30,0.03),transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute top-[62rem] right-[-12rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03),transparent_70%)] blur-3xl" />
        <Suspense fallback={null}>
          {pageContent.sections.map((section, i) => (
            <SectionRenderer key={`${section.type}-${i}`} section={section} />
          ))}
        </Suspense>
      </main>
      {pageContent.site ? (
        <SiteFooter
          content={pageContent.site.footer}
          brand={pageContent.site.brand}
        />
      ) : null}
    </>
  )
}
