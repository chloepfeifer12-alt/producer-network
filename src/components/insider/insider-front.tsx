"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info } from "lucide-react";
import type { Article, InsiderSection } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { articlesByDate, coverStory, SECTION_ORDER } from "@/lib/services/insider";
import { mentors } from "@/lib/services/network";
import { brand } from "@/config/brand";
import { OrgLogo } from "@/components/brand/org-logo";
import { Avatar } from "@/components/ui/avatar";
import { RESOURCE_KIND_LABEL } from "@/components/marketing/resource-card";
import { cn } from "@/lib/utils/cn";
import { ArticleArt, articleDate, articleHref, authorLabel, leadQuote, SectionLabel, StoryHeadline, StoryMeta } from "./parts";
import { DEMO_NOTE, issueMonth, SECTION_LABEL } from "./sections";
import { SectionNav, sectionAnchor } from "./section-nav";
import { CompactStory, FeatureRow, LeadWithRail, SectionOpener, Wrap } from "./story-layouts";
import { EventsListing } from "./events-block";

export function InsiderFront() {
  const db = useDb();
  const all = useMemo(() => articlesByDate(db), [db]);
  const cover = useMemo(() => coverStory(db), [db]);
  const bySection = useMemo(() => {
    const m = new Map<InsiderSection, Article[]>();
    for (const s of SECTION_ORDER) m.set(s, []);
    for (const a of all) m.get(a.section)?.push(a);
    return m;
  }, [all]);
  const alsoInIssue = useMemo(() => all.filter((a) => a.id !== cover?.id).slice(0, 4), [all, cover]);
  const sections = useMemo(() => SECTION_ORDER.filter((s) => (bySection.get(s)?.length ?? 0) > 0 || s === "events"), [bySection]);

  return (
    <div className="pb-24">
      <Masthead />
      <SectionNav sections={sections} />

      {cover && (
        <Wrap className="pt-10 sm:pt-14">
          <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
            <CoverStory article={cover} />
            <aside aria-labelledby="in-this-issue" className="lg:col-span-4 lg:border-l lg:border-line lg:pl-10">
              <h2 id="in-this-issue" className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                In this issue <span className="h-px flex-1 bg-line" aria-hidden />
              </h2>
              <ol className="mt-2">
                {alsoInIssue.map((a, i) => (
                  <li key={a.id} className="group relative grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-b border-line py-5 last:border-b-0">
                    <span className="font-display text-[22px] leading-none tabular-nums text-ink-4">{i + 2}</span>
                    <div className="min-w-0">
                      {i === 0 && <ArticleArt article={a} ratio="aspect-[16/9]" className="mb-4" />}
                      <SectionLabel article={a} className="mb-1.5 block" />
                      <StoryHeadline article={a} className={cn("tracking-[-0.012em]", i === 0 ? "text-[24px] leading-[1.12]" : "text-[19px] leading-[1.18]")} />
                      <StoryMeta article={a} className="mt-2" date={false} />
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </Wrap>
      )}

      {sections.map((s) => (
        <SectionBlock key={s} section={s} articles={bySection.get(s) ?? []} coverId={cover?.id} />
      ))}

      <Wrap className="mt-24">
        <IssueIndex articles={all} />
      </Wrap>
    </div>
  );
}

function Masthead() {
  return (
    <header className="pt-8 sm:pt-12">
      <Wrap>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          <span>{brand.name} · Editorial</span>
          <span>
            Issue · {issueMonth()} · <span className="text-gold-ink">Demo edition</span>
          </span>
        </div>
        <div className="border-t-[3px] border-ink" />
        <div className="grid gap-x-10 gap-y-5 py-6 sm:py-8 lg:grid-cols-12 lg:items-end">
          <h1 className="font-display text-[76px] leading-[0.86] tracking-[-0.045em] text-ink sm:text-[124px] lg:col-span-8 lg:text-[156px]">The Insider</h1>
          <p className="max-w-[38ch] font-display text-[19px] italic leading-[1.4] text-ink-2 sm:text-[21px] lg:col-span-4 lg:pb-3">
            Field notes on careers, craft and leadership from across insurance and financial services.
          </p>
        </div>
        <div className="border-t border-ink" />
        <p className="flex items-start gap-2 py-3 text-[12px] leading-relaxed text-ink-3">
          <Info className="mt-[2px] h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
          {DEMO_NOTE}
        </p>
      </Wrap>
    </header>
  );
}

function CoverStory({ article }: { article: Article }) {
  return (
    <article className="group relative lg:col-span-8">
      <ArticleArt article={article} ratio="aspect-[4/3] sm:aspect-[16/9]" label />
      <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">Cover story</span>
        <span aria-hidden className="h-3 w-px bg-line-strong" />
        <SectionLabel article={article} />
      </div>
      <StoryHeadline article={article} as="h2" className="mt-3 max-w-[22ch] text-[38px] leading-[1.02] tracking-[-0.03em] sm:text-[54px] lg:text-[62px]" />
      <p className="mt-5 max-w-[56ch] text-[18px] leading-[1.55] text-ink-2 sm:text-[19px]">{article.dek}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="text-[13px] text-ink-3">
          By <span className="font-medium text-ink">{authorLabel(article)}</span>
          {authorLabel(article) !== "The Insider desk" && <span> · {article.authorRole}</span>}
        </p>
        <StoryMeta article={article} author={false} />
      </div>
    </article>
  );
}

function SectionBlock({ section, articles, coverId }: { section: InsiderSection; articles: Article[]; coverId?: string }) {
  const db = useDb();
  const anchor = { id: sectionAnchor(section), "data-section": section, className: "scroll-mt-[124px]" };

  if (section === "interviews") {
    return (
      <section {...anchor} aria-label={SECTION_LABEL[section]} className={cn(anchor.className, "mt-24 bg-ink py-16 text-canvas sm:py-20")}>
        <Wrap>
          <SectionOpener section={section} inverted />
          <div className="mt-12 grid gap-y-14 lg:grid-cols-2 lg:gap-x-0 lg:gap-y-0">
            {articles.slice(0, 2).map((a, i) => (
              <InterviewLead key={a.id} article={a} className={cn(i === 1 && "lg:border-l lg:border-canvas/20 lg:pl-12", i === 0 && "lg:pr-12")} />
            ))}
          </div>
        </Wrap>
      </section>
    );
  }

  if (section === "events") {
    const preview = articles[0];
    return (
      <section {...anchor} aria-label={SECTION_LABEL[section]} className={cn(anchor.className, "mt-24 border-y border-line bg-subtle py-16 sm:py-20")}>
        <Wrap>
          <SectionOpener section={section} />
          <div className="mt-10 grid gap-x-12 gap-y-12 lg:grid-cols-12">
            {preview && (
              <article className="group relative lg:col-span-5">
                <ArticleArt article={preview} ratio="aspect-[3/2]" />
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Preview</p>
                <StoryHeadline article={preview} className="mt-2 text-[28px] leading-[1.08] tracking-[-0.02em]" />
                <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{preview.dek}</p>
                <StoryMeta article={preview} className="mt-4" />
              </article>
            )}
            <div className={preview ? "lg:col-span-7" : "lg:col-span-12"}>
              <h3 className="mb-4 font-display text-[22px] tracking-[-0.01em] text-ink">On the calendar</h3>
              <EventsListing />
            </div>
          </div>
        </Wrap>
      </section>
    );
  }

  return (
    <section {...anchor} aria-label={SECTION_LABEL[section]} className={cn(anchor.className, "mt-24")}>
      <Wrap>
        <SectionOpener section={section} />
        <div className="mt-10">
          <SectionBody section={section} articles={articles} coverId={coverId} db={db} />
        </div>
      </Wrap>
    </section>
  );
}

function SectionBody({ section, articles, coverId, db }: { section: InsiderSection; articles: Article[]; coverId?: string; db: ReturnType<typeof useDb> }) {
  const [lead, ...rest] = articles;
  if (!lead) return null;

  if (section === "leadership") {
    const isLeader = (topics: string[] = []) => topics.some((t) => /leader|hiring|perpetuation|management|coaching/i.test(t));
    const leaders = [...mentors(db)].sort((a, b) => Number(isLeader(b.mentor?.topics)) - Number(isLeader(a.mentor?.topics)) || b.yearsInIndustry - a.yearsInIndustry).slice(0, 3);
    const rail = leaders.length ? (
      <div>
        <h3 className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          Leaders who mentor <span className="h-px flex-1 bg-line" aria-hidden />
        </h3>
        <ul className="mt-2 divide-y divide-line">
          {leaders.map((p) => {
            const u = db.users.find((x) => x.id === p.userId);
            if (!u) return null;
            return (
              <li key={p.userId}>
                <Link href={`/people/${p.userId}`} className="group flex items-start gap-4 py-4">
                  <Avatar name={u.name} tone={p.avatarTone} size={44} decorative />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">{u.name}</p>
                    <p className="truncate text-[13px] text-ink-3">{p.headline}</p>
                    <p className="mt-1 text-[12px] text-ink-4">{p.mentor?.topics.slice(0, 2).join(" · ")}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 text-ink-4 transition-colors group-hover:text-ink" strokeWidth={1.75} />
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href="/people" className="group mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
          Find a mentor <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    ) : null;
    return (
      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {articles.map((a) => (
            <article key={a.id} className="group relative grid gap-6 border-b border-line pb-8 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_180px]">
              <div>
                {a.id === coverId && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">From the cover</p>}
                <StoryHeadline article={a} className="text-[28px] leading-[1.08] tracking-[-0.02em] sm:text-[32px]" />
                {leadQuote(a) && <p className="mt-4 border-l-2 border-ink pl-4 font-display text-[19px] italic leading-[1.4] text-ink-2">“{leadQuote(a)!.text}”</p>}
                <StoryMeta article={a} className="mt-4" />
              </div>
              <ArticleArt article={a} ratio="aspect-[4/3] sm:aspect-square" className="order-first sm:order-none" />
            </article>
          ))}
        </div>
        <div className="lg:col-span-5 lg:border-l lg:border-line lg:pl-10">{rail}</div>
      </div>
    );
  }

  if (section === "education") {
    const library = db.resources.slice(0, 5);
    return (
      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
          {articles.slice(0, 2).map((a) => (
            <article key={a.id} className="group relative">
              <ArticleArt article={a} ratio="aspect-[3/2]" />
              <StoryHeadline article={a} className="mt-5 text-[25px] leading-[1.1] tracking-[-0.015em]" />
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{a.dek}</p>
              <StoryMeta article={a} className="mt-4" />
            </article>
          ))}
        </div>
        <aside aria-labelledby="from-the-library" className="lg:col-span-4 lg:border-l lg:border-line lg:pl-10">
          <h3 id="from-the-library" className="font-display text-[24px] italic tracking-[-0.01em] text-ink">
            From the library
          </h3>
          <p className="mt-1 text-[13px] text-ink-3">Guides, checklists and replays from the resource library.</p>
          <ul className="mt-4 border-t border-ink">
            {library.map((r) => (
              <li key={r.id} className="border-b border-line">
                <Link href={`/resources/${r.slug}`} className="group block py-4">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-4">
                    {RESOURCE_KIND_LABEL[r.kind]} · {r.minutes} min
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-snug tracking-[-0.005em] text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">{r.title}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/resources" className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
            Visit the library <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </aside>
      </div>
    );
  }

  if (section === "emerging") {
    const orgIds = Array.from(new Set(articles.flatMap((a) => a.relatedOrgIds)));
    const orgs = orgIds.map((id) => db.organizations.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => !!o && o.listingStatus === "approved");
    return (
      <LeadWithRail
        lead={lead}
        rest={rest}
        rail={
          <div className="mt-8 border-t border-ink pt-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Organizations in these stories</h3>
            {orgs.length > 0 && (
              <ul className="mt-4 grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
                {orgs.map((o) => (
                  <li key={o.id}>
                    <Link href={`/organizations/${o.slug}`} className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-sunken/60">
                      <OrgLogo brand={o.brand} name={o.name} size={32} />
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium text-ink">{o.name}</span>
                        <span className="block truncate text-[12px] text-ink-3">{o.tagline}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/opportunities" className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
              Browse open opportunities <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        }
      />
    );
  }

  if (section === "spotlight") {
    const subject = lead.subjectUserId ? db.users.find((u) => u.id === lead.subjectUserId) : undefined;
    const profile = lead.subjectUserId ? db.profiles.find((p) => p.userId === lead.subjectUserId) : undefined;
    const aside =
      subject && profile && profile.visibility !== "private" ? (
        <Link href={`/people/${subject.id}`} className="group/m inline-flex items-center gap-3 border-t border-line pt-5">
          <Avatar name={subject.name} tone={profile.avatarTone} size={40} decorative />
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">In the spotlight</span>
            <span className="text-[14.5px] font-medium text-ink group-hover/m:underline group-hover/m:underline-offset-4">{subject.name}</span>
            <span className="text-[13px] text-ink-3"> · {profile.headline}</span>
          </span>
        </Link>
      ) : undefined;
    return (
      <div className="space-y-12">
        <FeatureRow article={lead} reverse aside={aside} />
        {rest.length > 0 && (
          <div className="grid gap-x-10 border-t border-line pt-8 lg:grid-cols-2">
            {rest.map((a) => (
              <CompactStory key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (rest.length === 0) return <FeatureRow article={lead} />;
  return <LeadWithRail lead={lead} rest={rest} />;
}

function InterviewLead({ article, className }: { article: Article; className?: string }) {
  const q = leadQuote(article);
  return (
    <article className={cn("group relative flex flex-col lg:row-span-2 lg:grid lg:grid-rows-subgrid", className)}>
      <div>
        <div className="h-14 w-14 overflow-hidden rounded-full sm:h-[88px] sm:w-[88px]">
          <ArticleArt article={article} ratio="h-full w-full" />
        </div>
        {q && <blockquote className="mt-6 font-display sm:mt-8 text-[28px] italic leading-[1.22] tracking-[-0.01em] text-canvas text-balance sm:text-[34px]">“{q.text}”</blockquote>}
        {q?.cite && <p className="mt-4 text-[13px] text-canvas/60">— {q.cite}</p>}
      </div>
      <div className="mt-auto pt-8 lg:mt-0">
        <div className="border-t border-canvas/20 pt-6">
          <h3 className="font-display text-[22px] leading-[1.2] tracking-[-0.01em] text-canvas text-balance sm:text-[24px]">
            <Link href={articleHref(article)} className="decoration-canvas/40 underline-offset-[5px] after:absolute after:inset-0 group-hover:underline">
              {article.title}
            </Link>
          </h3>
          <p className="mt-2 text-[14.5px] leading-relaxed text-canvas/70">{article.dek}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-canvas/85">
            Read the interview · {article.readMinutes} min <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>
    </article>
  );
}

function IssueIndex({ articles }: { articles: Article[] }) {
  return (
    <section aria-labelledby="issue-index">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink pt-5">
        <h2 id="issue-index" className="font-display text-[34px] leading-none tracking-[-0.02em] text-ink sm:text-[40px]">
          The full issue
        </h2>
        <p className="text-[13px] text-ink-3">
          {articles.length} stories · {issueMonth()}
        </p>
      </div>
      <ol className="mt-6">
        {articles.map((a) => (
          <li key={a.id} className="group relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1 border-b border-line py-4 sm:grid-cols-[72px_190px_minmax(0,1fr)_auto] sm:items-baseline">
            <time dateTime={a.publishedAt} className="hidden text-[12.5px] tabular-nums text-ink-4 sm:block">
              {articleDate(a)}
            </time>
            <SectionLabel article={a} className="col-span-2 sm:col-span-1" />
            <Link
              href={articleHref(a)}
              className="font-display text-[19px] leading-snug text-ink after:absolute after:inset-0 group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4 sm:text-[20px]"
            >
              {a.title}
            </Link>
            <span className="self-center text-[12.5px] tabular-nums text-ink-4">{a.readMinutes} min</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
