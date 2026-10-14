import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ban, Database, FlaskConical, HardDrive, KeyRound, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/page";
import { CheckList, MarketingHero, NumberedItem, Section } from "@/components/marketing/section";
import { ResetDemoButton } from "@/components/marketing/reset-demo-button";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "About",
  description: `Why ${brand.name} exists, what it is and isn’t, and notes on this prototype.`,
};

const SIMULATED = [
  "Every person, organization, opportunity, post, event and metric is fictional synthetic data.",
  "Sign-in is a demo role switcher — there are no passwords, identity checks or real accounts.",
  "Applications, messages and introductions never leave this browser and reach no real organization.",
  "Listing review, moderation and organization approval are performed by demo admin personas.",
  "Plans, prices, invoices and sponsored placements are illustrative — no billing is connected.",
  "License records are self-reported and always labeled “Self-reported — Not verified.”",
  "Analytics are demonstration data generated for the prototype.",
  "Legal documents are placeholders that require review by qualified counsel and are not in effect.",
  "Emails use the reserved .invalid domain; nothing is ever sent.",
];

export default function AboutPage() {
  return (
    <>
      <MarketingHero
        eyebrow={`About ${brand.name}`}
        title={<>The industry protects everyone else. <span className="italic text-ink-3">Who looks after its careers?</span></>}
        lede="Insurance employs millions of people and quietly underwrites nearly every part of modern life. Yet the way its professionals find their next role, their mentors and their people is still scattered across cold calls, generic job boards and recruiting pitches that promise too much. We think the industry deserves a better professional home."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="eyebrow mb-3">Our mission</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">Make every career decision in insurance a well-informed one.</h2>
          </div>
          <div className="space-y-5 text-[16px] leading-relaxed text-ink-2">
            <p>
              A producer choosing between a W-2 role at an independent agency and an affiliation with an IMO is making a decision that shapes
              their income, their independence and the clients they’ll serve for years. Too often they make it with less information than they’d
              want when buying a car.
            </p>
            <p>
              {brand.name} brings that information into the open. Organizations present themselves with substance — how they train, how they
              pay, what producers pay for. Members build profiles that reflect their real expertise and decide exactly who can see them. And a
              professional community gives everyone, from career changers to agency principals, a place to learn from one another.
            </p>
            <p>
              We are independent. We don’t sell insurance, we don’t place candidates, and we don’t earn more when anyone signs with anyone.
              That independence is the product.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading eyebrow="Clarity about our role" title="What we are — and what we are not" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-canvas p-7 sm:p-8">
            <h3 className="text-[15px] font-semibold text-ink">We are</h3>
            <CheckList
              className="mt-5"
              items={[
                "A professional network for insurance and financial services professionals, and people exploring the field.",
                "A career marketplace where reviewed organizations publish opportunities with clear terms.",
                "A recruiting workspace for organizations, built on candidate consent.",
                "An editorial resource for understanding the industry’s many career paths.",
              ]}
            />
          </div>
          <div className="rounded-[22px] border border-line bg-canvas p-7 sm:p-8">
            <h3 className="text-[15px] font-semibold text-ink">We are not</h3>
            <ul className="mt-5 space-y-3">
              {[
                ["An insurer, agency or investment adviser", "We don’t sell, quote or bind insurance, give investment advice, or recommend any product or security."],
                ["A recruiting or staffing firm", "We don’t place candidates and charge no placement fees or commission shares."],
                ["A licensing authority or verifier", "License and registration details on profiles are self-reported. Confirm licenses with your state department of insurance and registrations with FINRA."],
                ["An employer or guarantor", "We don’t guarantee employment, affiliation or earnings with any organization."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3 text-[14.5px] leading-relaxed">
                  <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-danger-50 text-danger ring-1 ring-danger/15">
                    <X className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <span>
                    <span className="font-medium text-ink">{t}.</span> <span className="text-ink-3">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Principles" title="How we make decisions" />
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-3">
          <NumberedItem n={1} title="Transparency">
            Compensation is shown exactly as disclosed. Producer costs are stated before anyone applies. Employment and contracting are always
            labeled. Sponsored content is always marked and kept apart from organic results.
          </NumberedItem>
          <NumberedItem n={2} title="Consent">
            Members are private by default toward recruiters. Nothing is shared with an organization unless a member applies or explicitly
            opts in — and every choice can be changed at any time.
          </NumberedItem>
          <NumberedItem n={3} title="Independence">
            No commission sharing, premium-based fees or placement fees. Organic rankings are never for sale. We succeed when the network is
            trusted — not when any particular deal closes.
          </NumberedItem>
        </div>
      </Section>

      <Section id="prototype" tone="subtle">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-gold-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-ink ring-1 ring-inset ring-gold-200">
              <FlaskConical className="h-3.5 w-3.5" /> Prototype notes
            </div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">You’re looking at a working prototype.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
              It is built to demonstrate the product experience end to end — for producers, organizations and platform administrators — using
              entirely synthetic data. Please treat everything here accordingly.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex gap-3.5 rounded-xl border border-line bg-surface p-4">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} />
                <div className="text-[13.5px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">The role switcher is not authentication.</span> Anyone can become any persona from
                  the bar at the top of the page. A production system requires a real identity provider and server-side authorization.
                </div>
              </div>
              <div className="flex gap-3.5 rounded-xl border border-line bg-surface p-4">
                <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} />
                <div className="text-[13.5px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Data is stored only in this browser.</span> Changes you make are saved to local
                  storage on this device. Nothing is sent to a server, and other people never see your changes.
                </div>
              </div>
              <div className="flex gap-3.5 rounded-xl border border-line bg-surface p-4">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} />
                <div className="text-[13.5px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Resetting demo data.</span> Restore the original seed at any time with the button
                  below, or from <span className="font-medium">Reset demo data</span> in the role switcher menu.
                  <div className="mt-3"><ResetDemoButton /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] border border-line bg-surface p-7 shadow-card sm:p-8">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink"><Ban className="h-4 w-4 text-ink-3" /> What’s simulated</h3>
            <ul className="mt-5 divide-y divide-line">
              {SIMULATED.map((s) => (
                <li key={s} className="py-3 text-[14px] leading-relaxed text-ink-2 first:pt-0 last:pb-0">{s}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-2 border-t border-line pt-6">
              <ButtonLink href="/join?step=persona" size="sm">Try a demo persona <ArrowRight className="h-3.5 w-3.5" /></ButtonLink>
              <ButtonLink href="/support" size="sm" variant="secondary">Help center</ButtonLink>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs leading-relaxed text-ink-3">
          {brand.legalEntity}. See the <Link href="/legal/terms" className="underline underline-offset-2 hover:text-ink">terms</Link> and{" "}
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-ink">privacy</Link> placeholders.
        </p>
      </Section>
    </>
  );
}
