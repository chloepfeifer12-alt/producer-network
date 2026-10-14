import type { Metadata } from "next";
import { Suspense } from "react";
import { OrganizationCompare } from "@/components/discovery/organization-compare";
import { DetailSkeleton } from "@/components/discovery/skeletons";

export const metadata: Metadata = {
  title: "Compare organizations",
  description: "Compare insurance organizations side by side: training, mentorship, lead programs, compensation approach and more.",
};

export default function ComparePage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <OrganizationCompare />
    </Suspense>
  );
}
