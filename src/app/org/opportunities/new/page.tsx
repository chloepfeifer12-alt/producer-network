"use client";

import { OrgScope } from "@/components/org/org-scope";
import { OpportunityEditor } from "@/components/org/opportunity-editor";

export default function NewOpportunityPage() {
  return <OrgScope>{(ctx) => <OpportunityEditor ctx={ctx} />}</OrgScope>;
}
