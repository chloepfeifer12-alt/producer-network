import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { MarketingHero, Section } from "@/components/marketing/section";
import { ResourceLibrary } from "./resource-library";

export const metadata: Metadata = {
  title: "Career resources",
  description: "Practical guides, checklists and templates for exploring, starting and leading a career in insurance and financial services.",
};

export default function ResourcesPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Resource library"
        title={<>Practical guidance for <span className="italic text-ink-3">every stage</span> of a career in insurance and financial services.</>}
        lede="Guides, checklists and templates written to help you make better decisions — whether you’re weighing your first offer, planning your first 90 days, or building an onboarding program for a team."
        actions={
          <ButtonLink href="/launch" variant="secondary">
            Newly licensed? Visit the New Producer Portal <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        }
      />
      <Section className="pt-12 sm:pt-16">
        <ResourceLibrary />
        <Notice tone="info" className="mt-12" icon={<Info className="h-4 w-4" />}>
          Resources are general, educational editorial demo content. They are not legal, tax, licensing or financial advice. For licensing
          requirements, confirm with your state department of insurance; for securities registrations, with FINRA and your sponsoring firm. New to the industry? Start with{" "}
          <Link href="/explore" className="font-medium underline underline-offset-2">Explore the industry</Link>.
        </Notice>
      </Section>
    </>
  );
}
