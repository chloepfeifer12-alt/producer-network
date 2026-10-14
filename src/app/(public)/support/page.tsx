import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, FileText, LifeBuoy, ShieldCheck, UserRound } from "lucide-react";
import { Container } from "@/components/ui/page";
import { FaqList, Section } from "@/components/marketing/section";
import { DemoContactForm } from "@/components/marketing/demo-contact-form";
import { LEGAL_DOCS } from "@/components/marketing/legal-docs";

export const metadata: Metadata = {
  title: "Support",
  description: "Answers for producers and organizations, and how to reach the team.",
};

const PRODUCER_FAQ = [
  {
    q: "Is membership free?",
    a: "Yes. Licensed producers and people exploring insurance and financial services careers can create a profile, apply to opportunities and join the community at no cost.",
  },
  {
    q: "Who can see my profile?",
    a: (
      <>
        You choose. Profiles are visible to signed-in members by default, and you can hide yours from the member directory entirely.
        Organizations can contact you without an application only if you turn on recruiter contact — it’s off unless you choose it. Manage
        everything from <Link href="/me/settings" className="font-medium text-navy-600 hover:text-navy">Privacy &amp; consent</Link>.
      </>
    ),
  },
  {
    q: "What does an organization see when I apply?",
    a: "Only what you choose to share in that application — for example contact email, license records, NPN and experience are separate choices. Your choices are saved as a snapshot with the application.",
  },
  {
    q: "Why does my license say “Self-reported — Not verified”?",
    a: "The platform does not verify licenses. Anything you enter is labeled as self-reported. Organizations should confirm licensing through official sources, and you can confirm your own status with your state department of insurance.",
  },
  {
    q: "What’s the difference between a job and an affiliation?",
    a: "A job is W-2 employment with an organization. An affiliation is an independent-contractor relationship — you typically run your own business and may bear costs such as E&O, leads or technology. Every listing is labeled so you know which one you’re looking at.",
  },
  {
    q: "I saw a listing that promises guaranteed income. What should I do?",
    a: "Please report it from the listing page. Income guarantees and unsubstantiated earnings claims violate our listing standards, and every report is reviewed by a person.",
  },
];

const ORG_FAQ = [
  {
    q: "How long does listing review take?",
    a: "New organizations start in a pending state while our team reviews the profile against our listing standards. In this prototype, a demo administrator can approve it immediately from the admin console.",
  },
  {
    q: "Does approval mean you verified our organization?",
    a: "No. Review checks that your listing content meets our standards — clear compensation structure, disclosed producer costs and accurate employment classification. It is not a verification of licenses, appointments, financials or claims you make.",
  },
  {
    q: "Why was my opportunity sent to review instead of publishing?",
    a: "Listings are pre-screened for language like guarantees, earnings claims or undisclosed costs. Flagged listings are reviewed by a person, who may approve them or request changes.",
  },
  {
    q: "Can we contact members directly?",
    a: "Only members who have opted in to recruiter contact appear in talent discovery, and every introduction is logged. Members who haven’t opted in are reachable only through their own applications.",
  },
  {
    q: "How do sponsored placements work?",
    a: (
      <>
        Sponsored placements are labeled, reviewed and always displayed separately from organic results. See{" "}
        <Link href="/for-organizations#sponsored" className="font-medium text-navy-600 hover:text-navy">sponsored placements</Link> and{" "}
        <Link href="/pricing" className="font-medium text-navy-600 hover:text-navy">plans</Link>.
      </>
    ),
  },
];

export default function SupportPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <Container className="relative pb-14 pt-14 sm:pb-16 sm:pt-20">
          <div className="eyebrow mb-4 flex items-center gap-2"><LifeBuoy className="h-3.5 w-3.5" /> Help center</div>
          <h1 className="max-w-3xl font-display text-[40px] leading-[1.05] sm:text-[56px]">How can we help?</h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-3">
            Straight answers about privacy, applications, listings and how the platform works.
          </p>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Help topics">
            {[
              { href: "#producers", label: "For producers", icon: UserRound },
              { href: "#organizations", label: "For organizations", icon: Building2 },
              { href: "#contact", label: "Contact", icon: LifeBuoy },
              { href: "#legal", label: "Policies", icon: FileText },
            ].map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-[13px] text-ink-2 transition hover:border-ink-4 hover:text-ink">
                <Icon className="h-3.5 w-3.5" /> {label}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      <Section id="producers" size="narrow">
        <div className="mb-8">
          <div className="eyebrow mb-3">Members</div>
          <h2 className="font-display text-[30px] leading-tight sm:text-[36px]">For producers &amp; aspiring producers</h2>
        </div>
        <FaqList items={PRODUCER_FAQ} />
      </Section>

      <Section id="organizations" size="narrow" className="pt-0 sm:pt-0">
        <div className="mb-8">
          <div className="eyebrow mb-3">Organizations</div>
          <h2 className="font-display text-[30px] leading-tight sm:text-[36px]">For organizations</h2>
        </div>
        <FaqList items={ORG_FAQ} />
      </Section>

      <Section id="contact" tone="surface">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="eyebrow mb-3">Contact</div>
            <h2 className="font-display text-[32px] leading-[1.1] sm:text-[40px]">Still need a hand?</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-3">
              Send a note and the support team would follow up by email. For privacy requests — such as accessing or deleting your data —
              choose the privacy topic.
            </p>
            <div className="mt-8 flex gap-3.5 rounded-xl border border-line bg-canvas p-4 text-[13.5px] leading-relaxed text-ink-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} />
              To report a specific listing, post or member, use the report option on that page so the trust team has full context.
            </div>
          </div>
          <div className="rounded-[22px] border border-line bg-canvas p-6 sm:p-8">
            <DemoContactForm />
          </div>
        </div>
      </Section>

      <Section id="legal">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">Policies</div>
            <h2 className="font-display text-[30px] leading-tight sm:text-[36px]">Legal documents</h2>
            <p className="mt-2 text-sm text-ink-3">All documents are placeholders pending review by qualified legal counsel and are not in effect.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEGAL_DOCS.map((d) => (
            <Link key={d.slug} href={`/legal/${d.slug}`} className="group flex items-start justify-between gap-4 rounded-xl border border-line bg-surface p-5 shadow-card transition hover:border-line-strong hover:shadow-lift">
              <span>
                <span className="block text-[14.5px] font-medium text-ink">{d.title}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-3">{d.summary}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:text-ink" />
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
