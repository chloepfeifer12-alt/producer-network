"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ORG_CATEGORY_LABEL } from "@/lib/data/taxonomy";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { SectionHead } from "@/components/editorial";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { RecruitingDot } from "@/components/domain/org-card";
import { cn } from "@/lib/utils/cn";
import { FollowButton } from "./actions";
import type { FeaturedOrg } from "./hq-data";

function Why({ text, fitLabel }: { text: string; fitLabel?: string }) {
  return (
    <p className="mt-2.5 flex items-start gap-1.5 text-[13px] leading-relaxed text-ink-2">
      <Sparkles className="mt-[3px] h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.75} aria-hidden />
      <span>
        {fitLabel && <span className="font-medium text-ink">{fitLabel} · </span>}
        {text}
      </span>
    </p>
  );
}

function LeadOrg({ f }: { f: FeaturedOrg }) {
  const { org } = f;
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[6px]">
        <div className="aspect-[16/9] transition-transform duration-700 ease-out group-hover:scale-[1.03]">
          <CoverArt seed={org.id} variant={variantFor(org.id)} hue={org.brand.color} ground={org.brand.tint} />
        </div>
        <div className="absolute bottom-4 left-4"><OrgLogo brand={org.brand} name={org.name} size={52} className="ring-4 ring-surface/80" /></div>
        <div className="absolute right-4 top-4"><FollowButton orgId={org.id} orgName={org.name} tone="onImage" /></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        <span>{ORG_CATEGORY_LABEL[org.category]}</span>
        <span className="text-ink-4">·</span>
        <span>{org.hqCity}, {org.hqState}</span>
      </div>
      <h3 className="mt-2 font-display text-[28px] leading-[1.1] tracking-[-0.01em] text-ink">
        <Link href={`/organizations/${org.slug}`} className="decoration-1 underline-offset-[5px] after:absolute after:inset-0 hover:underline focus-visible:outline-none">
          {org.name}
        </Link>
      </h3>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-3">{org.tagline}</p>
      <Why text={f.why} fitLabel={f.fitLabel} />
      <div className="mt-4 flex items-center gap-4 text-[12px] text-ink-4">
        <RecruitingDot status={org.recruitingStatus} />
        <span>Fictional organization</span>
      </div>
    </article>
  );
}

function SideOrg({ f, className }: { f: FeaturedOrg; className?: string }) {
  const { org } = f;
  return (
    <article className={cn("group relative grid grid-cols-[112px_minmax(0,1fr)] gap-5 sm:grid-cols-[168px_minmax(0,1fr)]", className)}>
      <div className="relative overflow-hidden rounded-[4px]">
        <div className="aspect-[4/3] h-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <CoverArt seed={org.id} variant={variantFor(org.id)} hue={org.brand.color} ground={org.brand.tint} />
        </div>
        <div className="absolute bottom-2 left-2"><OrgLogo brand={org.brand} name={org.name} size={30} className="ring-2 ring-surface/80" /></div>
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">{ORG_CATEGORY_LABEL[org.category]}</div>
        <h3 className="mt-1 text-[16.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          <Link href={`/organizations/${org.slug}`} className="decoration-1 underline-offset-4 after:absolute after:inset-0 hover:underline focus-visible:outline-none">
            {org.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{org.tagline}</p>
        <Why text={f.why} fitLabel={f.fitLabel} />
        <FollowButton orgId={org.id} orgName={org.name} className="mt-3" />
      </div>
    </article>
  );
}

export function FeaturedOrganizations({ items, title, dek }: { items: FeaturedOrg[]; title: string; dek: string }) {
  return (
    <section aria-label="Organizations worth discovering">
      <SectionHead kicker="Discover" title={title} dek={dek} href="/discover" linkLabel="Explore Discover" />
      {items.length === 0 ? (
        <EmptyState
          title="You're following every organization we'd suggest"
          description="Browse the full directory to find more agencies, IMOs and advisory firms."
          action={<ButtonLink href="/organizations" variant="secondary" size="sm">Open the directory</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <LeadOrg f={items[0]!} />
          </div>
          <div className="flex flex-col gap-8 lg:col-span-5 lg:border-l lg:border-line lg:pl-12">
            {items.slice(1).map((f, i) => (
              <SideOrg key={f.org.id} f={f} className={cn(i > 0 && "border-t border-line pt-8")} />
            ))}
            <Link href="/discover" className="mt-auto hidden border-t border-line pt-5 text-[13px] text-ink-3 hover:text-ink lg:block">
              Editorial collections, comparisons and the full directory live in <span className="font-medium text-ink underline decoration-line-strong underline-offset-4">Discover</span>.
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
