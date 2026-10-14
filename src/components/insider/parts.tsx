import type { ReactNode } from "react";
import Link from "next/link";
import type { Article } from "@/lib/data/types";
import { CoverArt } from "@/components/brand/cover-art";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { SECTION_LABEL, sectionHref } from "./sections";

export function articleHref(a: Article) {
  return `/insider/${a.slug}`;
}

/** Article cover art inside a clipping frame with the house hover zoom. */
export function ArticleArt({ article, className, ratio = "aspect-[16/10]", label }: { article: Article; className?: string; ratio?: string; label?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-sunken", ratio, className)}>
      <CoverArt
        seed={article.id}
        variant={article.art.variant}
        hue={article.art.hue}
        ground={article.art.ground}
        label={label ? `Illustration for “${article.title}”` : undefined}
        className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
}

/** Small uppercase section label; links to the section page unless `plain`. */
export function SectionLabel({ article, plain, className, prefix }: { article: Article; plain?: boolean; className?: string; prefix?: ReactNode }) {
  const cls = cn("text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3", className);
  const label = (
    <>
      {prefix}
      {SECTION_LABEL[article.section]}
    </>
  );
  if (plain) return <span className={cls}>{label}</span>;
  return (
    <Link href={sectionHref(article.section)} className={cn(cls, "relative z-10 hover:text-ink")}>
      {label}
    </Link>
  );
}

export function articleDate(a: Article, long = false) {
  return formatDate(a.publishedAt, long ? { month: "long", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });
}

/** Author · read time (· date). Authors that are the house byline read "The Insider". */
export function StoryMeta({ article, date = true, author = true, className }: { article: Article; date?: boolean; author?: boolean; className?: string }) {
  const parts: ReactNode[] = [];
  if (author)
    parts.push(
      <span key="a" className="font-medium text-ink-2">
        {authorLabel(article)}
      </span>,
    );
  parts.push(<span key="r">{article.readMinutes} min read</span>);
  if (date)
    parts.push(
      <time key="d" dateTime={article.publishedAt}>
        {articleDate(article)}
      </time>,
    );
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-3", className)}>
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && (
            <span aria-hidden className="text-ink-4">
              ·
            </span>
          )}
          {p}
        </span>
      ))}
    </p>
  );
}

export function authorLabel(a: Article) {
  return a.authorName.startsWith("The Insider") ? "The Insider desk" : a.authorName;
}

/** A headline that makes its whole parent (`relative` + `group`) clickable. */
export function StoryHeadline({ article, as: Tag = "h3", className }: { article: Article; as?: "h2" | "h3" | "h4"; className?: string }) {
  return (
    <Tag className={cn("font-display text-ink text-balance", className)}>
      <Link href={articleHref(article)} className="decoration-ink/30 decoration-1 underline-offset-[5px] after:absolute after:inset-0 group-hover:underline">
        {article.title}
      </Link>
    </Tag>
  );
}

/** The first pull quote in an article body, if any. */
export function leadQuote(a: Article) {
  for (const b of a.body) if (b.type === "quote") return b;
  return undefined;
}
