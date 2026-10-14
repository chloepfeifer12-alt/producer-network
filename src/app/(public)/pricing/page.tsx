import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Container } from "@/components/ui/page";
import { Notice } from "@/components/ui/feedback";
import { CheckList, FaqList, Section } from "@/components/marketing/section";
import { PricingView } from "./pricing-view";

export const metadata: Metadata = {
  title: "Plans & pricing",
  description: "Illustrative plans for organizations recruiting on the network. No commission sharing, premium-based fees or placement fees.",
};

const FAQ = [
  {
    q: "Is this real pricing?",
    a: "No. These plans and prices are illustrative concepts for prototype review. No billing system is connected, no payment details are collected, and no payments are processed.",
  },
  {
    q: "Do you take a share of commissions or charge placement fees?",
    a: "Never. The platform does not charge commission sharing, premium-based fees, overrides or per-hire placement fees. Plans are a flat subscription for software and visibility — what you earn and what your producers earn is none of our business model.",
  },
  {
    q: "Does a higher plan rank my organization higher?",
    a: "No. Organic directory and search results are ordered by relevance or alphabetically, never by plan. The only way to appear above organic results is a sponsored placement, which is always labeled and shown in a separate block.",
  },
  {
    q: "Is there a cost for producers?",
    a: "Members — licensed producers and people exploring insurance and financial services careers — join and use the network at no cost.",
  },
  {
    q: "What happens after we apply?",
    a: "Your organization starts on the Directory plan with a pending listing. Our team reviews the profile against our listing standards. Once approved, your profile and reviewed opportunities appear publicly, and you can preview upgrades from Plan & billing.",
  },
  {
    q: "Can we cancel or change plans?",
    a: "In the intended product, plans would be month-to-month or annual with changes taking effect at the next billing period. Final terms would be set out in the organization agreement, which is currently a placeholder.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <Container className="relative pb-12 pt-14 text-center sm:pt-20">
          <div className="eyebrow mb-4">Plans for organizations</div>
          <h1 className="mx-auto max-w-3xl font-display text-[40px] leading-[1.05] sm:text-[56px]">Simple plans. No cut of anyone’s commission.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-3">
            A flat subscription for recruiting software and visibility. Free for producers, always.
          </p>
          <Notice tone="demo" className="mx-auto mt-8 max-w-2xl text-left" icon={<CreditCard className="h-4 w-4" />} title="Illustrative pricing for prototype review">
            No billing is connected, no payments are processed, and nothing on this page is an offer.
          </Notice>
        </Container>
      </section>

      <Section className="pt-12 sm:pt-16">
        <PricingView />
      </Section>

      <Section tone="surface">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <div className="eyebrow mb-3">How we make money — and how we don’t</div>
            <h2 className="font-display text-[30px] leading-[1.1] sm:text-[38px]">Aligned with producers, not with volume.</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
              Because we earn nothing from placements or production, we have no reason to push anyone toward a particular organization, product or contract.
            </p>
          </div>
          <CheckList
            items={[
              <><span className="font-medium text-ink">No commission sharing</span> — we never take a share of first-year or renewal commissions.</>,
              <><span className="font-medium text-ink">No premium-based fees</span> — pricing never scales with premium written.</>,
              <><span className="font-medium text-ink">No placement fees</span> — hire or affiliate as many people as you like.</>,
              <><span className="font-medium text-ink">No pay-to-rank</span> — organic results are never ordered by plan or spend.</>,
              <><span className="font-medium text-ink">Same standards on every plan</span> — every listing is reviewed the same way.</>,
            ]}
          />
        </div>
      </Section>

      <Section size="narrow">
        <div className="mb-8">
          <div className="eyebrow mb-3">Questions</div>
          <h2 className="font-display text-[30px] leading-tight sm:text-[38px]">Pricing FAQ</h2>
        </div>
        <FaqList items={FAQ} />
        <p className="mt-6 text-sm text-ink-3">
          More questions? Visit <Link href="/support" className="font-medium text-navy-600 hover:text-navy">Support</Link> or read{" "}
          <Link href="/for-organizations" className="font-medium text-navy-600 hover:text-navy">how recruiting works</Link>.
        </p>
      </Section>
    </>
  );
}
