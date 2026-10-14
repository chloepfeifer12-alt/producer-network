import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Scale, TriangleAlert } from "lucide-react";
import { Breadcrumbs, Container } from "@/components/ui/page";
import { LEGAL_DOCS, getLegalDoc } from "@/components/marketing/legal-docs";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils/cn";

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = getLegalDoc(doc);
  return d ? { title: `${d.title} (placeholder)`, description: d.summary } : { title: "Document not found" };
}

export default async function LegalDocPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc: slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  return (
    <Container className="py-10 sm:py-14">
      <Breadcrumbs items={[{ href: "/support#legal", label: "Legal" }, { label: doc.title }]} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="eyebrow mb-3 flex items-center gap-2"><Scale className="h-3.5 w-3.5" /> Documents</div>
          <nav aria-label="Legal documents" className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {LEGAL_DOCS.map((d) => {
              const active = d.slug === doc.slug;
              return (
                <Link
                  key={d.slug}
                  href={`/legal/${d.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-[13.5px] transition",
                    active ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-3 hover:bg-sunken/60 hover:text-ink",
                  )}
                >
                  {d.title}
                </Link>
              );
            })}
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <div role="note" className="rounded-2xl border-2 border-danger/30 bg-danger-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
              <div>
                <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-danger">Placeholder — requires review by qualified legal counsel</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#6e2620]">
                  This is not a final legal document and it is not in effect. It is a draft outline of intended topics for prototype review only.
                  Nothing on this page creates any rights or obligations.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="eyebrow mb-3 flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Draft outline · {doc.audience}</div>
            <h1 className="font-display text-[36px] leading-[1.08] sm:text-[48px]">{doc.title}</h1>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-3">{doc.summary}</p>
            <p className="mt-3 text-xs text-ink-4">{brand.legalEntity} · Version: draft outline, not dated</p>
          </div>

          <nav aria-label="On this page" className="mt-10 rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="text-[12px] font-medium text-ink-3">Outline</div>
            <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {doc.sections.map((s, i) => (
                <li key={s.heading}>
                  <a href={`#s-${i + 1}`} className="text-[13.5px] text-ink-2 hover:text-ink">
                    <span className="mr-2 tabular-nums text-ink-4">{i + 1}.</span>{s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-12 space-y-10">
            {doc.sections.map((s, i) => (
              <section key={s.heading} id={`s-${i + 1}`} className="scroll-mt-24 border-t border-line pt-8">
                <h2 className="flex items-baseline gap-3 text-[19px] font-semibold tracking-[-0.01em] text-ink">
                  <span className="font-display text-[22px] font-normal text-gold tabular-nums">{i + 1}.</span>
                  {s.heading}
                </h2>
                <p className="mt-2 text-xs italic text-ink-4">Intended topics (illustrative):</p>
                <ul className="mt-3 space-y-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                      <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-ink-4" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-14 border-t border-line pt-6 text-xs leading-relaxed text-ink-3">
            Questions about this placeholder? Visit <Link href="/support#contact" className="underline underline-offset-2 hover:text-ink">Support</Link>. See also{" "}
            <Link href="/about#prototype" className="underline underline-offset-2 hover:text-ink">prototype notes</Link>.
          </p>
        </article>
      </div>
    </Container>
  );
}
