"use client";

import { useMemo, useState } from "react";
import { BookOpen, Bookmark, Building2 } from "lucide-react";
import type { Opportunity, Organization, Resource } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { orgOpenOpportunities } from "@/lib/services/organizations";
import { toggleSaveResource } from "@/lib/services/network";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/tabs";
import { toastResult } from "@/components/ui/toast";
import { OpportunityCard } from "@/components/domain/opportunity-card";
import { OrgCard } from "@/components/domain/org-card";
import { SaveButton } from "@/components/domain/save-button";
import { ResourceRow } from "@/components/member/resource-row";

type TabKey = "opportunities" | "organizations" | "resources";

export default function SavedPage() {
  const db = useDb();
  const user = useCurrentUser();
  const [tab, setTab] = useState<TabKey>("opportunities");

  const { opps, orgs, resources } = useMemo(() => {
    if (!user) return { opps: [], orgs: [], resources: [] };
    const mine = <T,>(list: { userId: string; targetId: string }[], pool: (T & { id: string })[]) =>
      list
        .filter((s) => s.userId === user.id)
        .map((s) => pool.find((x) => x.id === s.targetId))
        .filter((x): x is T & { id: string } => !!x);
    return {
      opps: mine<Opportunity>(db.savedOpportunities, db.opportunities),
      orgs: mine<Organization>(db.savedOrganizations, db.organizations),
      resources: mine<Resource>(db.savedResources, db.resources),
    };
  }, [db, user]);

  const unsaveResource = (r: Resource) => {
    toastResult(toggleSaveResource(user, r.id), "Removed from saved", r.title);
  };

  return (
    <div>
      <PageHeader eyebrow="Library" title="Saved" description="Opportunities, organizations and resources you've bookmarked to revisit." />

      <Tabs<TabKey>
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "opportunities", label: "Opportunities", count: opps.length },
          { value: "organizations", label: "Organizations", count: orgs.length },
          { value: "resources", label: "Resources", count: resources.length },
        ]}
      />

      <div role="tabpanel">
        {tab === "opportunities" &&
          (opps.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {opps.map((o) => (
                <OpportunityCard key={o.id} o={o} org={db.organizations.find((x) => x.id === o.orgId)} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Bookmark className="h-5 w-5" />}
              title="No saved opportunities"
              description="Tap the bookmark on any opportunity to keep it here while you compare."
              action={<ButtonLink href="/opportunities" variant="secondary">Browse opportunities</ButtonLink>}
            />
          ))}

        {tab === "organizations" &&
          (orgs.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.map((o) => (
                <div key={o.id} className="relative">
                  <OrgCard org={o} openCount={orgOpenOpportunities(db, o.id).length} className="h-full" />
                  {/* Unsave sits above the card's full-surface link. */}
                  <div className="absolute left-3 top-3 z-20 rounded-lg bg-surface/90 shadow-card backdrop-blur-sm">
                    <SaveButton targetId={o.id} type="organization" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Building2 className="h-5 w-5" />}
              title="No saved organizations"
              description="Save agencies, IMOs, carriers and brokerages you'd like to follow."
              action={<ButtonLink href="/organizations" variant="secondary">Browse organizations</ButtonLink>}
            />
          ))}

        {tab === "resources" &&
          (resources.length ? (
            <Card className="overflow-hidden">
              <ul className="divide-y divide-line">
                {resources.map((r) => <ResourceRow key={r.id} resource={r} onUnsave={() => unsaveResource(r)} />)}
              </ul>
            </Card>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-5 w-5" />}
              title="No saved resources"
              description="Save guides, checklists and webinars to read later."
              action={<ButtonLink href="/resources" variant="secondary">Explore resources</ButtonLink>}
            />
          ))}
      </div>
    </div>
  );
}
