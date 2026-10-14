import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Briefcase, Compass, ShieldAlert, Sparkles } from "lucide-react";
import { Container, Breadcrumbs } from "@/components/ui/page";
import { LineIcon } from "@/components/ui/line-icon";
import { ButtonLink } from "@/components/ui/button";
import { INSURANCE_LINES, LINE_BY_SLUG, SECTOR_LABEL } from "@/lib/data/taxonomy";
import type { LineSlug } from "@/lib/data/types";
import { LineLiveSections } from "./line-live-sections";

export function generateStaticParams() {
  return INSURANCE_LINES.map((l) => ({ line: l.slug }));
}

function findLine(slug: string) {
  return LINE_BY_SLUG[slug as LineSlug] as (typeof LINE_BY_SLUG)[LineSlug] | undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ line: string }> }): Promise<Metadata> {
  const { line } = await params;
  const l = findLine(line);
  if (!l) return { title: "Category not found" };
  return { title: `${l.name} careers`, description: l.summary };
}

export default async function LinePage({ params }: { params: Promise<{ line: string }> }) {
  const { line: slug } = await params;
  const line = findLine(slug);
  if (!line) notFound();
  const fs = line.sector === "financial_services";

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <LineIcon line={line.slug} aria-hidden className="pointer-events-none absolute -right-16 top-10 hidden h-[340px] w-[340px] text-ink/[0.035] lg:block" strokeWidth={0.6} />
        <Container className="relative pb-14 pt-10 sm:pb-20 sm:pt-12">
          <Breadcrumbs items={[{ href: "/explore", label: "Explore" }, { label: line.name }]} />
          <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white shadow-lift">
            <LineIcon line={line.slug} className="h-7 w-7" />
          </div>
          <div className="eyebrow mt-8">{SECTOR_LABEL[line.sector]} · Career category</div>
          <h1 className="mt-3 max-w-3xl font-display text-[40px] leading-[1.05] sm:text-[56px]">{line.name}</h1>
          <p className="mt-4 max-w-2xl font-display text-[21px] italic leading-snug text-ink-2 sm:text-[24px]">{line.summary}</p>
          <p className="mt-6 max-w-2xl text-[15.5px] leading-relaxed text-ink-3">{line.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={`/opportunities?lines=${line.slug}`} size="lg">
              <Briefcase className="h-4 w-4" /> Browse {line.shortName} opportunities
            </ButtonLink>
            <ButtonLink href="#organizations" variant="secondary" size="lg">Who’s recruiting</ButtonLink>
          </div>
        </Container>
      </section>

      <Container className="py-16 sm:py-20">
        <div className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line md:grid-cols-3">
          <ListPanel icon={<Compass className="h-4 w-4" strokeWidth={1.75} />} title="Career paths" items={line.careerPaths} />
          <ListPanel icon={<Briefcase className="h-4 w-4" strokeWidth={1.75} />} title="Typical roles" items={line.typicalRoles} />
          <ListPanel icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />} title="Core skills" items={line.skills} />
        </div>

        <aside className="mt-8 grid gap-5 rounded-2xl border border-warning/20 bg-warning-50 p-6 sm:grid-cols-[auto_1fr] sm:p-7" aria-labelledby="licensing-note">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-warning ring-1 ring-warning/20">
            <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 id="licensing-note" className="text-[15px] font-semibold text-[#5f430d]">
              {fs ? "A general licensing & registration note" : "A general licensing note"}
            </h2>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#5f430d]/90">{line.licensingNote}</p>
            {fs && (
              <p className="mt-3 text-[13px] leading-relaxed text-[#5f430d]/90">
                FINRA and state registration requirements vary by role and usually require sponsorship by a broker-dealer or registration with an
                investment adviser firm. The platform provides no investment advice and does not recommend any security, product or firm.
              </p>
            )}
            <p className="mt-3 text-[13px] leading-relaxed text-[#5f430d]/80">
              Requirements, exams, pre-licensing education and continuing education differ by state and change over time. Confirm with your
              state department of insurance{fs ? ", FINRA and your sponsoring firm" : ""}. This overview is educational — it is not legal or
              licensing advice, and this category is not a legal classification of license types or registrations.
            </p>
          </div>
        </aside>
      </Container>

      <LineLiveSections slug={line.slug} />
    </>
  );
}

function ListPanel({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="bg-surface p-6 sm:p-7">
      <div className="flex items-center gap-2 text-ink-3">
        {icon}
        <h2 className="eyebrow">{title}</h2>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-3 text-[15px] text-ink">
            <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-gold" aria-hidden />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
