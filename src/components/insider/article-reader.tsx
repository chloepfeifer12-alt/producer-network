"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Info } from "lucide-react";
import type { Article } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { getArticle, relatedArticles } from "@/lib/services/insider";
import { lineName, ORG_CATEGORY_LABEL } from "@/lib/data/taxonomy";
import { CoverArt } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { ArticleBody } from "./article-body";
import { ArticleArt, articleDate, authorLabel, SectionLabel, StoryHeadline, StoryMeta } from "./parts";
import { ReadingProgress } from "./reading-progress";
import { DEMO_NOTE, SECTION_LABEL, sectionHref } from "./sections";
import { Wrap } from "./story-layouts";

export function ArticleReader({ slug }: { slug: string }) {
  const db = useDb();
  const article = useMemo(() => getArticle(db, slug), [db, slug]);
  if (!article) return <ArticleMissing />;
  return <Reader article={article} />;
}

export function ArticleMissing() {
  return (
    <Wrap className="py-24">
      <div className="mx-auto max-w-xl border-t-2 border-ink pt-8 text-center">
        <p className="font-display text-[15px] italic text-ink-4">The Insider</p>
        <h1 className="mt-2 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink">This story isn’t in the issue</h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-ink-3">The link may be mistyped, or the piece may have been retired from the demo edition.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/insider">Back to The Insider</ButtonLink>
          <ButtonLink href="/resources" variant="secondary">
            Browse the library
          </ButtonLink>
        </div>
      </div>
    </Wrap>
  );
}

function Reader({ article }: { article: Article }) {
  const db = useDb();
  const bodyRef = useRef<HTMLDivElement>(null);
  const related = useMemo(() => relatedArticles(db, article, 3), [db, article]);
  const orgs = useMemo(
    () => article.relatedOrgIds.map((id) => db.organizations.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => !!o && o.listingStatus === "approved"),
    [db.organizations, article.relatedOrgIds],
  );
  const member = useMemo(() => {
    if (!article.subjectUserId) return undefined;
    const user = db.users.find((u) => u.id === article.subjectUserId);
    const profile = db.profiles.find((p) => p.userId === article.subjectUserId);
    if (!user || !profile || profile.visibility === "private") return undefined;
    return { user, profile };
  }, [db.users, db.profiles, article.subjectUserId]);
  const isHouse = authorLabel(article) === "The Insider desk";
  const memberIsAuthor = !!member && member.user.name === article.authorName;

  return (
    <article className="pb-24">
      <ReadingProgress target={bodyRef} />

      <div className="relative h-[clamp(220px,42vh,520px)] w-full overflow-hidden border-b border-line">
        <CoverArt seed={article.id} variant={article.art.variant} hue={article.art.hue} ground={article.art.ground} label={`Illustration for “${article.title}”`} />
      </div>

      <Wrap>
        <header className="grid pt-10 sm:pt-14 lg:grid-cols-12">
          <div className="lg:col-span-10 xl:col-span-9">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              <Link href="/insider" className="hover:text-ink">
                The Insider
              </Link>
              <span aria-hidden className="h-3 w-px bg-line-strong" />
              <SectionLabel article={article} />
            </nav>
            <h1 className="mt-5 font-display text-[38px] leading-[1.03] tracking-[-0.03em] text-ink text-balance sm:text-[54px] lg:text-[66px]">{article.title}</h1>
            <p className="mt-6 max-w-[60ch] font-display text-[21px] leading-[1.45] text-ink-2 sm:text-[24px]">{article.dek}</p>
          </div>
        </header>

        <div className="mt-10 grid gap-x-12 border-t border-ink lg:grid-cols-12">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-5 lg:col-span-12">
            <div className="flex items-center gap-3">
              {isHouse ? (
                <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-[17px] italic text-canvas">
                  I
                </span>
              ) : (
                <Avatar name={article.authorName} tone={memberIsAuthor ? member!.profile.avatarTone : 0} size={40} decorative />
              )}
              <div className="leading-tight">
                <p className="text-[14px] text-ink">
                  By <span className="font-semibold">{authorLabel(article)}</span>
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-3">{article.authorRole}</p>
              </div>
            </div>
            <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
            <p className="text-[12.5px] text-ink-3">
              <time dateTime={article.publishedAt}>{articleDate(article, true)}</time>
              <span aria-hidden className="mx-2 text-ink-4">
                ·
              </span>
              {article.readMinutes} min read
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink sm:ml-auto">Fictional · demo editorial</p>
          </div>
        </div>

        <div className="grid gap-x-12 gap-y-14 border-t border-line pt-12 lg:grid-cols-12">
          <div ref={bodyRef} className="min-w-0 lg:col-span-8 xl:col-span-7 xl:col-start-2">
            <ArticleBody blocks={article.body} />

            <div className="mt-14 max-w-[66ch]">
              {article.lines.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
                  <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Filed under</span>
                  {article.lines.map((l) => (
                    <Link key={l} href={`/explore/${l}`} className="rounded-full border border-line px-3 py-1 text-[12.5px] text-ink-2 transition-colors hover:border-ink-4 hover:text-ink">
                      {lineName(l)}
                    </Link>
                  ))}
                </div>
              )}
              <p className="mt-8 flex items-start gap-2.5 border-t border-line pt-5 text-[12.5px] leading-relaxed text-ink-3">
                <Info className="mt-[2px] h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>
                  <span className="font-medium text-ink-2">About this story. </span>
                  {DEMO_NOTE} Names, organizations and quotations are invented for the demo.
                </span>
              </p>
            </div>
          </div>

          <aside aria-label="In this story" className="lg:col-span-4 lg:col-start-9 xl:col-span-3 xl:col-start-10">
            <div className="space-y-10 lg:sticky lg:top-[96px]">
              {member && (
                <section aria-labelledby="featured-member">
                  <h2 id="featured-member" className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                    {memberIsAuthor ? "About the writer" : "Featured member"} <span className="h-px flex-1 bg-line" aria-hidden />
                  </h2>
                  <Link href={`/people/${member.user.id}`} className="group mt-4 block">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.user.name} tone={member.profile.avatarTone} size={52} decorative />
                      <div className="min-w-0">
                        <p className="font-display text-[21px] leading-tight text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">{member.user.name}</p>
                        <p className="text-[12.5px] text-ink-3">
                          {member.profile.city}, {member.profile.state}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{member.profile.headline}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 group-hover:text-ink">
                      View profile <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </Link>
                </section>
              )}

              {orgs.length > 0 && (
                <section aria-labelledby="related-orgs">
                  <h2 id="related-orgs" className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                    Organizations in this story <span className="h-px flex-1 bg-line" aria-hidden />
                  </h2>
                  <ul className="mt-3 divide-y divide-line">
                    {orgs.map((o) => (
                      <li key={o.id}>
                        <Link href={`/organizations/${o.slug}`} className="group flex items-center gap-3 py-3">
                          <OrgLogo brand={o.brand} name={o.name} size={36} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">{o.name}</span>
                            <span className="block truncate text-[12px] text-ink-3">{ORG_CATEGORY_LABEL[o.category]}</span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink" strokeWidth={1.75} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-ink-4">Fictional organizations. Mention is not an endorsement.</p>
                </section>
              )}

              <section aria-labelledby="more-in-section" className="border-t-2 border-ink pt-4">
                <h2 id="more-in-section" className="font-display text-[15px] italic text-ink-3">
                  More in
                </h2>
                <Link href={sectionHref(article.section)} className="group mt-1 inline-flex items-center gap-2 font-display text-[24px] leading-tight text-ink">
                  {SECTION_LABEL[article.section]}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </section>
            </div>
          </aside>
        </div>
      </Wrap>

      {related.length > 0 && (
        <section aria-labelledby="continue-reading" className="mt-24">
          <Wrap>
            <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink pt-5">
              <h2 id="continue-reading" className="font-display text-[32px] leading-none tracking-[-0.02em] text-ink sm:text-[38px]">
                Continue reading
              </h2>
              <Link href="/insider" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
                The full issue <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-y-12 md:-mx-8 md:grid-cols-3 md:divide-x md:divide-line">
              {related.map((a) => (
                <article key={a.id} className="group relative md:px-8">
                  <ArticleArt article={a} ratio="aspect-[3/2]" />
                  <SectionLabel article={a} className="mt-5 block" />
                  <StoryHeadline article={a} className="mt-2 text-[22px] leading-[1.14] tracking-[-0.012em]" />
                  <StoryMeta article={a} className="mt-3" />
                </article>
              ))}
            </div>
          </Wrap>
        </section>
      )}
    </article>
  );
}
