"use client";

import { useMemo } from "react";
import { useDb } from "@/lib/store/db-store";
import { publishedOpportunities } from "@/lib/services/opportunities";
import { approvedOrganizations, orgOpenOpportunities } from "@/lib/services/organizations";
import { OrgCard } from "@/components/domain/org-card";
import { OpportunityCard } from "@/components/domain/opportunity-card";
import { SponsoredTag } from "@/components/ui/feedback";
import { cn } from "@/lib/utils/cn";

/**
 * Shows what a sponsored organization and sponsored opportunity look like,
 * using the shared cards and real (synthetic) seed records.
 */
export function SponsoredPreview({ className }: { className?: string }) {
  const db = useDb();
  const { org, opp, oppOrg } = useMemo(() => {
    const orgs = approvedOrganizations(db);
    const opps = publishedOpportunities(db);
    const orgPlacement = db.sponsored.find((s) => !s.opportunityId && orgs.some((o) => o.id === s.orgId));
    const oppPlacement = db.sponsored.find((s) => s.opportunityId && opps.some((o) => o.id === s.opportunityId));
    const org = orgs.find((o) => o.id === orgPlacement?.orgId) ?? orgs[0];
    const opp = opps.find((o) => o.id === oppPlacement?.opportunityId) ?? opps[0];
    const oppOrg = opp ? db.organizations.find((o) => o.id === opp.orgId) : undefined;
    return { org, opp, oppOrg };
  }, [db]);

  return (
    <div className={cn("rounded-[22px] border border-gold-200 bg-gold-50/60 p-4 sm:p-6", className)}>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] text-gold-ink">
        <SponsoredTag /> <span>Preview · a separate block above organic results</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        {org && <OrgCard org={org} sponsored openCount={orgOpenOpportunities(db, org.id).length} />}
        {opp && <OpportunityCard o={opp} org={oppOrg} sponsored />}
      </div>
      <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-ink-4" aria-hidden>
        <span className="h-px flex-1 bg-line-strong" /> Organic results begin here <span className="h-px flex-1 bg-line-strong" />
      </div>
    </div>
  );
}
