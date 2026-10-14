import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Article, InsiderSection } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";
import { ArticleArt, SectionLabel, StoryHeadline, StoryMeta } from "./parts";
import { SECTION_DEK, SECTION_LABEL, sectionHref, sectionNumber } from "./sections";

/** Page width shared by the Insider (matches the public header). */
export function Wrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

/** Numbered section opener: heavy rule, numeral, serif name, dek, link. */
export function SectionOpener({ section, inverted, link = true, as: Tag = "h2" }: { section: InsiderSection; inverted?: boolean; link?: boolean; as?: "h1" | "h2" }) {
  return (
    <div className={cn("grid gap-x-10 gap-y-3 border-t-2 pt-5 lg:grid-cols-12 lg:items-end", inverted ? "border-canvas" : "border-ink")}>
      <div className="lg:col-span-5">
        <div className={cn("font-display text-[15px] italic tabular-nums", inverted ? "text-canvas/55" : "text-ink-4")}>No. {sectionNumber(section)}</div>
        <Tag className={cn("mt-1 font-display text-[34px] leading-[1.02] tracking-[-0.02em] sm:text-[44px]", inverted ? "text-canvas" : "text-ink")}>{SECTION_LABEL[section]}</Tag>
      </div>
      <p className={cn("max-w-[52ch] text-[14.5px] leading-relaxed lg:col-span-4 lg:pb-1.5", inverted ? "text-canvas/70" : "text-ink-3")}>{SECTION_DEK[section]}</p>
      {link && (
        <div className="lg:col-span-3 lg:pb-1.5 lg:text-right">
          <Link
            href={sectionHref(section)}
            className={cn("group inline-flex items-center gap-1.5 text-[13px] font-medium", inverted ? "text-canvas/80 hover:text-canvas" : "text-ink-2 hover:text-ink")}
          >
            All {SECTION_LABEL[section]} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/** One story, art beside text. Used when a section leads with a single piece. */
export function FeatureRow({ article, reverse, aside, label = false }: { article: Article; reverse?: boolean; aside?: ReactNode; label?: boolean }) {
  return (
    <article className="group relative grid gap-x-10 gap-y-6 lg:grid-cols-12 lg:items-center">
      <ArticleArt article={article} ratio="aspect-[16/10]" className={cn("lg:col-span-7", reverse && "lg:order-2")} />
      <div className={cn("lg:col-span-5", reverse && "lg:order-1")}>
        {label && <SectionLabel article={article} className="mb-3 block" />}
        <StoryHeadline article={article} className="text-[30px] leading-[1.06] tracking-[-0.02em] sm:text-[40px]" />
        <p className="mt-4 max-w-[46ch] text-[16.5px] leading-relaxed text-ink-2">{article.dek}</p>
        <StoryMeta article={article} className="mt-5" />
        {aside && <div className="relative z-10 mt-6">{aside}</div>}
      </div>
    </article>
  );
}

/** A lead story with art (7 cols) and secondary stories stacked in a rail (5 cols). */
export function LeadWithRail({ lead, rest, rail }: { lead: Article; rest: Article[]; rail?: ReactNode }) {
  return (
    <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12">
      <article className="group relative lg:col-span-7">
        <ArticleArt article={lead} ratio="aspect-[16/10]" />
        <StoryHeadline article={lead} className="mt-6 text-[28px] leading-[1.08] tracking-[-0.02em] sm:text-[36px]" />
        <p className="mt-3 max-w-[58ch] text-[16.5px] leading-relaxed text-ink-2">{lead.dek}</p>
        <StoryMeta article={lead} className="mt-4" />
      </article>
      <div className="lg:col-span-5 lg:border-l lg:border-line lg:pl-10">
        {rest.length === 1 && !rail ? (
          <article className="group relative">
            <ArticleArt article={rest[0]!} ratio="aspect-[4/3]" />
            <StoryHeadline article={rest[0]!} className="mt-6 text-[24px] leading-[1.12] tracking-[-0.015em] sm:text-[27px]" />
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{rest[0]!.dek}</p>
            <StoryMeta article={rest[0]!} className="mt-4" />
          </article>
        ) : (
          <div className="divide-y divide-line">
            {rest.map((a) => (
              <CompactStory key={a.id} article={a} />
            ))}
          </div>
        )}
        {rail}
      </div>
    </div>
  );
}

/** Text-led story with a small art tile; for rails and lists. */
export function CompactStory({ article, showSection, className }: { article: Article; showSection?: boolean; className?: string }) {
  return (
    <article className={cn("group relative grid grid-cols-[minmax(0,1fr)_88px] gap-5 py-6 first:pt-0 sm:grid-cols-[minmax(0,1fr)_112px]", className)}>
      <div className="min-w-0">
        {showSection && <SectionLabel article={article} className="mb-2 block" />}
        <StoryHeadline article={article} className="text-[21px] leading-[1.15] tracking-[-0.012em]" />
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-ink-3">{article.dek}</p>
        <StoryMeta article={article} className="mt-3" />
      </div>
      <ArticleArt article={article} ratio="aspect-square" />
    </article>
  );
}
