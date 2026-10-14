import type { Metadata } from "next";
import { seedOrganizations } from "@/lib/data/seed/organizations";
import { OrganizationProfilePage } from "@/components/discovery/organization-profile";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Titles come from seed data; organizations created locally in the demo fall back to a generic title.
  const org = seedOrganizations.find((o) => o.slug === slug && o.listingStatus === "approved");
  return { title: org ? org.name : "Organization", description: org?.tagline };
}

export default function Page() {
  return <OrganizationProfilePage />;
}
