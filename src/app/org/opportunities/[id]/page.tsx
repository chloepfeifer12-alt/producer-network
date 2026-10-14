"use client";

import { useParams } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { OrgScope } from "@/components/org/org-scope";
import { OpportunityEditor } from "@/components/org/opportunity-editor";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";

export default function EditOpportunityPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params.id ?? ""));
  return (
    <OrgScope>
      {(ctx) => {
        const opp = ctx.db.opportunities.find((o) => o.id === id && o.orgId === ctx.org.id);
        if (!opp) {
          return (
            <div>
              <PageHeader breadcrumbs={[{ href: "/org/opportunities", label: "Opportunities" }, { label: "Not found" }]} title="Opportunity not found" />
              <EmptyState
                icon={<FileQuestion className="h-5 w-5" strokeWidth={1.75} />}
                title="We couldn't find that listing"
                description="It may have been removed, or it belongs to another organization. Listings are only editable by their own organization."
                action={<ButtonLink href="/org/opportunities" variant="secondary" size="sm">Back to opportunities</ButtonLink>}
              />
            </div>
          );
        }
        return <OpportunityEditor key={opp.id} ctx={ctx} opportunity={opp} />;
      }}
    </OrgScope>
  );
}
