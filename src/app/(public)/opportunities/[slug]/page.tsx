import type { Metadata } from "next";
import { seedOpportunities } from "@/lib/data/seed/opportunities";
import { OpportunityDetailPage } from "@/components/discovery/opportunity-detail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Titles come from seed data; listings created locally in the demo fall back to a generic title.
  const o = seedOpportunities.find((x) => x.slug === slug && x.status === "published");
  return { title: o ? o.title : "Opportunity", description: o?.summary };
}

export default function Page() {
  return <OpportunityDetailPage />;
}
