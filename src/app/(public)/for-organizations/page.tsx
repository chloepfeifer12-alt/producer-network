import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Building2,
  ChartLine,
  CircleDollarSign,
  ClipboardCheck,
  Eye,
  FileWarning,
  Handshake,
  KanbanSquare,
  Scale,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/page";
import { Notice } from "@/components/ui/feedback";
import { CheckList, CtaBand, FeatureItem, MarketingHero, NumberedItem, Section } from "@/components/marketing/section";
import { PipelinePreview } from "@/components/marketing/pipeline-preview";
import { SponsoredPreview } from "@/components/marketing/sponsored-preview";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "For organizations",
  description: "Recruiting and talent discovery for agencies, IMOs, FMOs, carriers, brokerages, MGAs, advisory firms, broker-dealers and bank programs — built on transparency and consent.",
};

export default function ForOrganizationsPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Built for organizations"
        title={<>Recruit the way the best producers <span className="italic text-ink-3">want to be recruited.</span></>}
        lede={`${brand.name} gives agencies, IMOs, carriers, brokerages, MGAs, claims organizations, advisory firms, broker-dealers and bank programs one place to present who they are, publish clear opportunities, and build relationships with insurance and financial services professionals — on terms that respect candidates.`}
        actions={
          <>
            <ButtonLink href="/join/organization" size="lg">List your organization <ArrowRight className="h-4 w-4" /></ButtonLink>
            <ButtonLink href="/pricing" variant="secondary" size="lg">View plans</ButtonLink>
          </>
        }
      />

      <Section className="pt-14 sm:pt-20">
        <div className="grid items-start gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <div className="lg:sticky lg:top-28">
            <div className="eyebrow mb-3">The recruiting workspace</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">From first impression to signed agreement.</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-3">
              A calm, structured pipeline for every application — notes your team keeps private, messages candidates can see, interview
              scheduling and a full activity trail. Stages speak the industry’s language, including offer and contract discussions for
              affiliations.
            </p>
            <ButtonLink href="/join?step=persona" variant="secondary" className="mt-7">
              Explore the recruiting workspace (demo)
            </ButtonLink>
            <p className="mt-3 text-xs leading-relaxed text-ink-3">
              Choose the <span className="font-medium text-ink-2">Independent agency</span> or <span className="font-medium text-ink-2">IMO</span> persona
              in the demo role switcher to open a fully working workspace. Demo roles are not real sign-in.
            </p>
          </div>
          <PipelinePreview />
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading eyebrow="What you get" title="Everything a modern recruiting team needs — nothing that erodes trust." />
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureItem icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />} title="An organization profile worth reading">
            Culture, leadership, training programs, mentorship, lead policy and compensation approach — the details producers actually weigh,
            presented with editorial polish.
          </FeatureItem>
          <FeatureItem icon={<ClipboardCheck className="h-5 w-5" strokeWidth={1.75} />} title="Reviewed listings">
            Every organization and every opportunity is reviewed by our team before it appears publicly. Review checks listing content against
            our standards; it does not verify licenses, appointments or claims made by the organization.
          </FeatureItem>
          <FeatureItem icon={<UserRoundCheck className="h-5 w-5" strokeWidth={1.75} />} title="Consent-based talent discovery">
            Search members who have opted in to recruiter contact. Profiles you see reflect each member’s privacy choices; outreach is logged
            and members can decline in one click.
          </FeatureItem>
          <FeatureItem icon={<KanbanSquare className="h-5 w-5" strokeWidth={1.75} />} title="A recruiting pipeline">
            Move candidates from new application to hired or affiliated, keep private team notes, message candidates and schedule interviews.
          </FeatureItem>
          <FeatureItem icon={<ChartLine className="h-5 w-5" strokeWidth={1.75} />} title="Listing analytics">
            Views, applications and stage conversion for each opportunity, so you can improve the listing rather than guess. Analytics in the
            prototype are demonstration data.
          </FeatureItem>
          <FeatureItem icon={<Handshake className="h-5 w-5" strokeWidth={1.75} />} title="A place in the community">
            Participate in the industry feed, groups and events as your organization — contribute expertise, not advertising.
          </FeatureItem>
        </div>
      </Section>

      <Section>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <div className="eyebrow mb-3">Compliance-first recruiting</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">Standards that make every listing more credible — including yours.</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-3">
              Producers have learned to be skeptical of recruiting pitches. Our listing standards exist so that a candidate who finds you here
              starts with trust instead of suspicion. They apply equally to every organization, on every plan.
            </p>
            <Link href="/legal/organization-terms" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy">
              Read the organization terms (placeholder) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-7">
            <NumberedItem n={1} title="No unsubstantiated income claims">
              No “unlimited income,” earnings projections or top-producer figures presented as typical. Compensation is shown exactly as you
              disclose it — model, and a range only if you choose to share one.
            </NumberedItem>
            <NumberedItem n={2} title="Producer costs disclosed up front">
              If a role involves costs to the producer — leads, E&amp;O, technology, licensing, marketing — the listing must say so before anyone applies.
            </NumberedItem>
            <NumberedItem n={3} title="Employment or contracting, stated plainly">
              Every listing is labeled as W-2 employment or an independent-contractor affiliation, and the classification must be accurate.
            </NumberedItem>
            <NumberedItem n={4} title="Automated pre-screening, human review">
              Listings are pre-screened for risky language like guarantees and earnings claims, then reviewed by a person before publishing.
            </NumberedItem>
          </div>
        </div>
      </Section>

      <Section id="sponsored" tone="subtle">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="eyebrow mb-3">Sponsored placements</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">Visibility you can buy. Trust you can’t.</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-3">
              Organizations can promote their profile or a specific opportunity on the home page, the directory, search results and category
              pages. Sponsorship buys a clearly labeled position — never a better rank in organic results.
            </p>
            <CheckList
              tone="gold"
              className="mt-7"
              items={[
                <>Always labeled <span className="font-medium text-ink">Sponsored</span>, on every surface.</>,
                "Shown in a separate block, never mixed into organic ordering.",
                "Reviewed by the platform before going live; the same listing standards apply.",
                "Directory and search results stay ordered by relevance or alphabetically — regardless of plan or spend.",
              ]}
            />
          </div>
          <SponsoredPreview />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="What we are not" title="Independent by design." description="Clarity about our role protects your organization and the producers you recruit." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Ban, t: "Not a recruiting firm", d: "We don’t place candidates or charge placement fees. You run your own recruiting." },
            { icon: CircleDollarSign, t: "No commission sharing", d: "We never take a share of commissions, premium-based fees or overrides." },
            { icon: FileWarning, t: "Not a license verifier", d: "License and registration details on member profiles are self-reported and labeled as unverified." },
            { icon: Scale, t: "Not an insurer, agency or adviser", d: "We don’t sell, quote or bind insurance, give investment advice, or recommend products." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
              <Icon className="h-5 w-5 text-ink-3" strokeWidth={1.75} />
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{t}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-3">{d}</p>
            </div>
          ))}
        </div>
        <Notice tone="demo" className="mt-8" icon={<Eye className="h-4 w-4" />}>
          Prototype: organizations, candidates and metrics shown on this page are fictional demo data.
        </Notice>
      </Section>

      <Section className="pt-0 sm:pt-0">
        <CtaBand
          eyebrow="Get started"
          title="Put your organization in front of the professionals shaping the industry."
          body="Apply in a few minutes. Our team reviews every organization before its profile goes live."
          actions={
            <>
              <ButtonLink href="/join/organization" size="lg" className="bg-white text-ink hover:bg-canvas">List your organization</ButtonLink>
              <ButtonLink href="/pricing" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">View plans</ButtonLink>
              <ButtonLink href="/join?step=persona" size="lg" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                <ShieldCheck className="h-4 w-4" /> Explore the demo workspace
              </ButtonLink>
            </>
          }
        />
      </Section>
    </>
  );
}
