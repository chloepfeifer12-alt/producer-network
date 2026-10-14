"use client";

import Link from "next/link";
import { GraduationCap, MapPin, Users } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { OrgLogo } from "@/components/brand/org-logo";
import { Tag } from "@/components/ui/badge";
import { DemoTag, SponsoredTag } from "@/components/ui/feedback";
import { ARRANGEMENT_LABEL, ORG_CATEGORY_LABEL, RECRUITING_LABEL, lineName } from "@/lib/data/taxonomy";
import { cn } from "@/lib/utils/cn";

export function footprintLabel(o: Organization) {
  if (o.statesServed.includes("ALL")) return `HQ ${o.hqCity}, ${o.hqState} · Nationwide`;
  return `HQ ${o.hqCity}, ${o.hqState} · ${o.statesServed.length} state${o.statesServed.length === 1 ? "" : "s"}`;
}

export function RecruitingDot({ status }: { status: Organization["recruitingStatus"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "actively_recruiting" ? "bg-success" : status === "selective" ? "bg-gold" : "bg-ink-4")} />
      {RECRUITING_LABEL[status]}
    </span>
  );
}

export function OrgCard({ org, sponsored, openCount, className }: { org: Organization; sponsored?: boolean; openCount?: number; className?: string }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        sponsored ? "border-gold-200" : "border-line hover:border-line-strong",
        className,
      )}
    >
      <div className="relative h-20" style={{ background: `linear-gradient(120deg, ${org.brand.tint}, color-mix(in oklab, ${org.brand.tint} 70%, white))` }}>
        <svg className="absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden>
          <defs>
            <pattern id={`p-${org.id}`} width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M0 22 22 0" stroke={org.brand.color} strokeOpacity="0.18" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p-${org.id})`} />
        </svg>
        <div className="absolute right-3 top-3 flex gap-1.5">{sponsored ? <SponsoredTag className="bg-surface/90" /> : <DemoTag>Fictional</DemoTag>}</div>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-7 mb-3"><OrgLogo brand={org.brand} name={org.name} size={52} className="ring-4 ring-surface" /></div>
        <div className="text-xs font-medium uppercase tracking-[0.1em] text-ink-4">{ORG_CATEGORY_LABEL[org.category]}</div>
        <h3 className="mt-1 text-[16.5px] font-semibold leading-snug tracking-[-0.01em]">
          <Link href={`/organizations/${org.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">{org.name}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-3">{org.tagline}</p>
        <div className="mt-4 space-y-1.5 text-[13px] text-ink-3">
          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{footprintLabel(org)}</div>
          <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{org.arrangements.map((a) => ARRANGEMENT_LABEL[a]).join(" · ")}</div>
          {org.trainingAvailable && <div className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Training programs available</div>}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {org.lines.slice(0, 3).map((l) => <Tag key={l}>{lineName(l, true)}</Tag>)}
          {org.lines.length > 3 && <Tag>+{org.lines.length - 3}</Tag>}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-4 mt-5">
          <RecruitingDot status={org.recruitingStatus} />
          {openCount != null && <span className="text-xs font-medium text-ink-2">{openCount} open {openCount === 1 ? "role" : "roles"}</span>}
        </div>
      </div>
    </article>
  );
}
