import type { Metadata } from "next";
import { Suspense } from "react";
import { OrganizationDirectory } from "@/components/discovery/organization-directory";
import { DiscoverySkeleton } from "@/components/discovery/skeletons";

export const metadata: Metadata = {
  title: "Organizations",
  description: "A curated national directory of insurance agencies, IMOs, carriers, brokerages and claims organizations — with honest detail on training, mentorship and lead programs.",
};

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<DiscoverySkeleton kind="organization" />}>
      <OrganizationDirectory />
    </Suspense>
  );
}
