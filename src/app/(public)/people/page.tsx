import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrationGate } from "@/components/layout/guards";
import { PeopleFront } from "@/components/people/people-front";
import { PeopleSkeleton } from "@/components/people/skeletons";

export const metadata: Metadata = {
  title: "People",
  description: "The people of the insurance and financial services industry: professional portfolios, mentors and a directory where every member chose to be found.",
};

export default function PeoplePage() {
  return (
    <HydrationGate fallback={<PeopleSkeleton />}>
      <Suspense fallback={<PeopleSkeleton />}>
        <PeopleFront />
      </Suspense>
    </HydrationGate>
  );
}
