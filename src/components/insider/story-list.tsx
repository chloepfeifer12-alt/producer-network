import type { ReactNode } from "react";
import Link from "next/link";
import type { Article, InsiderSection } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";
import { articleHref, authorLabel } from "./parts";
import { SECTION_SHORT } from "./sections";

/** One story as a calm text row: section · title · dek · read time. The whole row is the link. */
export function StoryRow({ article, showSection = true, stacked = false }: { article: Article; showSection?: boolean; stacked?: boolean }) {
  const side = showSection && !stacked;
  return (
    <li className="border-b border-line">
      <Link
        href={articleHref(article)}
        className={cn("group grid gap-x-8 gap-y-1.5 py-6", !stacked && "lg:items-baseline", side ? "lg:grid-cols-[148px_minmax(0,1fr)_96px]" : !stacked && "lg:grid-cols-[minmax(0,1fr)_96px]")}
      >
        {showSection && <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{SECTION_SHORT[article.section]}</span>}
        <span className="min-w-0">
          <span className="block font-display text-[21px] leading-[1.2] tracking-[-0.01em] text-ink text-balance decoration-ink/30 decoration-1 underline-offset-[5px] group-hover:underline sm:text-[22px]">
            {article.title}
          </span>
          <span className="mt-1.5 block max-w-[72ch] text-[15px] leading-relaxed text-ink-3 line-clamp-2">{article.dek}</span>
          <span className="mt-2 block text-[12.5px] text-ink-4">
            {authorLabel(article)}
            <span className={cn(!stacked && "lg:hidden")}> · {article.readMinutes} min read</span>
          </span>
        </span>
        {!stacked && <span className="hidden text-right text-[12.5px] tabular-nums text-ink-4 lg:block">{article.readMinutes} min read</span>}
      </Link>
    </li>
  );
}

export function StoryList({ articles, showSection = true, stacked, className }: { articles: Article[]; showSection?: boolean; stacked?: boolean; className?: string }) {
  return (
    <ul className={cn("border-t border-line", className)}>
      {articles.map((a) => (
        <StoryRow key={a.id} article={a} showSection={showSection} stacked={stacked} />
      ))}
    </ul>
  );
}

/** Pill shared by the filter chips (buttons) and the section links on section pages. */
export function chipClass(on: boolean) {
  return cn(
    "inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
    on ? "border-ink bg-ink text-canvas" : "border-line text-ink-3 hover:border-ink-4 hover:text-ink",
  );
}

/** Sections offered as filters on the front (Events lives in its own block). */
export const FILTER_SECTIONS: InsiderSection[] = ["insights", "career_guides", "leadership", "interviews", "education", "emerging", "spotlight"];

/** Page width shared by the Insider (matches the public header). */
export function Wrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}
