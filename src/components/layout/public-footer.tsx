import Link from "next/link";
import { brand } from "@/config/brand";
import { Wordmark } from "@/components/brand/wordmark";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Destinations",
    links: [
      { href: "/network", label: "The Network" },
      { href: "/discover", label: "Discover" },
      { href: "/opportunities", label: "Opportunities" },
      { href: "/people", label: "People" },
      { href: "/insider", label: "The Insider" },
      { href: "/fit", label: "Your Industry Fit" },
      { href: "/launch", label: "New Producer Portal" },
    ],
  },
  {
    title: "For organizations",
    links: [
      { href: "/for-organizations", label: "Recruit on the network" },
      { href: "/pricing", label: "Plans & pricing" },
      { href: "/join/organization", label: "List your organization" },
      { href: "/for-organizations#sponsored", label: "Sponsored placements" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/about#prototype", label: "Prototype notes" },
      { href: "/support", label: "Support" },
      { href: "/support#contact", label: "Contact" },
    ],
  },
  {
    title: "Legal (placeholders)",
    links: [
      { href: "/legal/terms", label: "Terms of Service" },
      { href: "/legal/privacy", label: "Privacy Policy" },
      { href: "/legal/producer-consent", label: "Producer Consent" },
      { href: "/legal/organization-terms", label: "Organization Terms" },
      { href: "/legal/advertising", label: "Advertising Agreement" },
      { href: "/legal/community-guidelines", label: "Community Guidelines" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-ink-3">The professional home of the insurance industry. An independent network — not an insurer, agency, recruiting firm or investment adviser.</p>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <div className="eyebrow mb-4">{c.title}</div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-2 transition hover:text-ink">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-xs leading-relaxed text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>© {brand.year} {brand.legalEntity}. Prototype — all people, organizations, listings and figures shown are fictional.</p>
          <p>{brand.name} does not sell insurance, provide licensing verification, or guarantee employment or earnings.</p>
        </div>
      </div>
    </footer>
  );
}
