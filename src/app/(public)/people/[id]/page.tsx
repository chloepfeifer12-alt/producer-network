import type { Metadata } from "next";
import { HydrationGate } from "@/components/layout/guards";
import { PersonPortfolio } from "@/components/people/portfolio";
import { PortfolioSkeleton } from "@/components/people/skeletons";

export const metadata: Metadata = {
  title: "Professional portfolio",
  description: "A member's professional portfolio on the network. Members control what is visible.",
};

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <HydrationGate fallback={<PortfolioSkeleton />}>
      <PersonPortfolio id={decodeURIComponent(id)} />
    </HydrationGate>
  );
}
