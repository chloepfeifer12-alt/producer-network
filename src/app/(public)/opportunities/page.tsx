import type { Metadata } from "next";
import { Suspense } from "react";
import { OpportunityMarketplace } from "@/components/discovery/opportunity-marketplace";
import { DiscoverySkeleton } from "@/components/discovery/skeletons";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Search insurance employment roles and independent contracting affiliations with transparent compensation, licensing, training and leads details.",
};

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<DiscoverySkeleton kind="opportunity" />}>
      <OpportunityMarketplace />
    </Suspense>
  );
}
