import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, GraduationCap, Info, Rocket, Route } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/page";
import { Notice } from "@/components/ui/feedback";
import { LineGrid } from "@/components/marketing/line-grid";
import { FeatureItem, MarketingHero, NumberedItem, Section } from "@/components/marketing/section";
import { INSURANCE_LINES, LINES_BY_SECTOR } from "@/lib/data/taxonomy";

export const metadata: Metadata = {
  title: "Explore insurance & financial services careers",
  description: "Career categories across insurance and financial services — what the work is like, typical roles, and who is hiring.",
};

export default function ExplorePage() {
  return (
    <>
      <MarketingHero
        eyebrow="Explore the industry"
        title={<>An industry of many careers, <span className="italic text-ink-3">not one job.</span></>}
        lede="Insurance and financial services are where risk and long-term goals become a plan — for families, employers, contractors, retirees and entire industries. Browse the corners of the field below to see what the work involves, the roles people grow into, and which organizations are hiring today."
        actions={
          <>
            <ButtonLink href="#categories" size="lg">Browse {INSURANCE_LINES.length} categories</ButtonLink>
            <ButtonLink href="/opportunities" variant="secondary" size="lg">See open opportunities</ButtonLink>
          </>
        }
      />

      <Section id="categories">
        <SectionHeading
          eyebrow="Career categories"
          title="Find your corner of the field"
          description="Counts reflect opportunities and organizations currently listed on the network in this demo."
        />
        <Notice tone="info" className="mb-12" icon={<Info className="h-4 w-4" />}>
          These are discoverable career categories designed for browsing — not a legal classification of producer licenses, lines of
          authority or securities registrations. Requirements vary by state and by role; always confirm with your state department of
          insurance and, for securities roles, with FINRA and your sponsoring firm.
        </Notice>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow mb-2">The core of the network</div>
            <h3 className="font-display text-[28px] leading-tight sm:text-[32px]">Insurance</h3>
          </div>
          <span className="text-[13px] text-ink-3">{LINES_BY_SECTOR.insurance.length} categories</span>
        </div>
        <LineGrid sector="insurance" />

        <div className="mb-6 mt-16 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow mb-2">Adjacent careers</div>
            <h3 className="font-display text-[28px] leading-tight sm:text-[32px]">Financial services</h3>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-3">
              Planning, wealth, retirement and securities roles — many of which work alongside insurance. The platform provides no
              investment advice; FINRA and state registration requirements vary and usually require sponsorship by a firm.
            </p>
          </div>
          <span className="text-[13px] text-ink-3">{LINES_BY_SECTOR.financial_services.length} categories</span>
        </div>
        <LineGrid sector="financial_services" />
      </Section>

      <Section tone="surface" id="start-here">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <div className="eyebrow mb-3">New to insurance or financial services?</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[42px]">Start here.</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-3">
              Many of the industry’s strongest professionals came from teaching, hospitality, operations, the military or finance. You
              don’t need a license to start exploring — you need a clear picture of the options and honest information about each path.
            </p>
            <Link href="/launch" className="group mt-8 flex items-center gap-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-5 transition hover:border-gold">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-gold-ink ring-1 ring-gold-200"><Rocket className="h-5 w-5" strokeWidth={1.75} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">New Producer Portal</span>
                <span className="block text-[13.5px] text-ink-3">For newly licensed producers — curated first roles, training-forward organizations and guidance.</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/resources" variant="primary">
                <BookOpen className="h-4 w-4" /> Read the career guides
              </ButtonLink>
              <ButtonLink href="/join" variant="secondary">
                Join as an aspiring producer <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
          <div className="space-y-8">
            <NumberedItem n={1} title="Explore the categories">
              Read how each area works day to day — who you serve, how you grow, which skills matter. Notice which ones you keep coming back to.
            </NumberedItem>
            <NumberedItem n={2} title="Understand licensing and registration">
              Most insurance producer roles require a state license with specific lines of authority; securities roles usually require FINRA
              exams and firm sponsorship. Some operations and service roles require neither. Your state department of insurance and FINRA are
              the authoritative sources.
            </NumberedItem>
            <NumberedItem n={3} title="Talk to people doing the work">
              Join the community, ask questions in the Newly Licensed Circle, and attend an open session. Context from practitioners beats any brochure.
            </NumberedItem>
            <NumberedItem n={4} title="Evaluate opportunities carefully">
              Look for organizations that disclose compensation structure, producer costs and whether a role is employment or contracting.
              Our listing standards require exactly that.
            </NumberedItem>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 sm:grid-cols-3">
          <FeatureItem icon={<Compass className="h-5 w-5" strokeWidth={1.75} />} title="Employment or contracting — always labeled">
            Every opportunity is marked as a W-2 job or an independent affiliation, so you understand the relationship before you apply.
          </FeatureItem>
          <FeatureItem icon={<GraduationCap className="h-5 w-5" strokeWidth={1.75} />} title="Training that is described, not promised">
            Organizations describe their training, mentorship and licensing support in their own words — and we ask them to be specific.
          </FeatureItem>
          <FeatureItem icon={<Route className="h-5 w-5" strokeWidth={1.75} />} title="Paths, not just postings">
            Each category maps typical roles and the paths people take from them, so a first job reads as a first step.
          </FeatureItem>
        </div>
      </Section>
    </>
  );
}
